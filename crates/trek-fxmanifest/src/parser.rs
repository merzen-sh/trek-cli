use crate::ast::{Field, Game, Manifest, Value};
use crate::lexer::{Lexer, Token};

pub struct Parser<'a> {
    lexer: Lexer<'a>,
    peeked: Option<Token>,
}

#[derive(Debug)]
pub enum ParseError {
    LexError(crate::lexer::LexError),
    ExpectedString {
        line: usize,
        col: usize,
        context: &'static str,
    },
    ExpectedIdentifier {
        line: usize,
        col: usize,
    },
    ExpectedOpenBrace {
        line: usize,
        col: usize,
    },
    ExpectedCloseBrace {
        line: usize,
        col: usize,
    },
    ExpectedCloseParen {
        line: usize,
        col: usize,
    },
    DuplicateFxVersion {
        line: usize,
        col: usize,
    },
    UnknownGame {
        value: String,
        line: usize,
        col: usize,
    },
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::LexError(e) => write!(f, "{e}"),
            Self::ExpectedString { line, col, context } => {
                write!(f, "expected string for {context} at {line}:{col}")
            }
            Self::ExpectedIdentifier { line, col } => {
                write!(f, "expected identifier at {line}:{col}")
            }
            Self::ExpectedOpenBrace { line, col } => {
                write!(f, "expected '{{' at {line}:{col}")
            }
            Self::ExpectedCloseBrace { line, col } => {
                write!(f, "expected '}}' at {line}:{col}")
            }
            Self::ExpectedCloseParen { line, col } => {
                write!(f, "expected ')' at {line}:{col}")
            }
            Self::DuplicateFxVersion { line, col } => {
                write!(f, "duplicate fx_version at {line}:{col}")
            }
            Self::UnknownGame { value, line, col } => {
                write!(f, "unknown game '{value}' at {line}:{col}")
            }
        }
    }
}

impl std::error::Error for ParseError {}

impl<'a> Parser<'a> {
    pub fn new(lexer: Lexer<'a>) -> Self {
        Self {
            lexer,
            peeked: None,
        }
    }

    fn bump(&mut self) -> Result<Token, ParseError> {
        match self.peeked.take() {
            Some(t) => Ok(t),
            None => self.lexer.next_token().map_err(ParseError::LexError),
        }
    }

    fn peek(&mut self) -> Result<&Token, ParseError> {
        if self.peeked.is_none() {
            self.peeked = Some(self.lexer.next_token().map_err(ParseError::LexError)?);
        }
        Ok(self.peeked.as_ref().unwrap())
    }

    fn skip_newlines(&mut self) -> Result<(), ParseError> {
        loop {
            match self.peek()? {
                Token::Newline | Token::Comment(_) => {
                    self.bump()?;
                }
                _ => break Ok(()),
            }
        }
    }

    fn expect_string(&mut self, context: &'static str) -> Result<String, ParseError> {
        let token = self.bump()?;
        match token {
            Token::StringLiteral(s) => Ok(s),
            _ => Err(ParseError::ExpectedString {
                line: 0,
                col: 0,
                context,
            }),
        }
    }

    fn parse_array(&mut self) -> Result<Vec<String>, ParseError> {
        let mut items = Vec::new();
        loop {
            self.skip_newlines()?;
            match self.peek()? {
                Token::CloseBrace => {
                    self.bump()?;
                    return Ok(items);
                }
                Token::StringLiteral(_) => {
                    items.push(self.expect_string("array item")?);
                    self.skip_newlines()?;
                    if matches!(self.peek()?, Token::Comma) {
                        self.bump()?;
                    }
                }
                _ => {
                    return Err(ParseError::ExpectedString {
                        line: 0,
                        col: 0,
                        context: "array item",
                    });
                }
            }
        }
    }

    fn parse_field_value(&mut self) -> Result<Value, ParseError> {
        self.skip_newlines()?;
        match self.peek()? {
            Token::StringLiteral(_) => {
                let s = self.expect_string("field value")?;
                Ok(Value::String(s))
            }
            Token::OpenBrace => {
                self.bump()?;
                let items = self.parse_array()?;
                Ok(Value::Array(items))
            }
            _ => Ok(Value::String(String::new())),
        }
    }

    fn maybe_open_paren(&mut self) -> Result<bool, ParseError> {
        if matches!(self.peek()?, Token::OpenParen) {
            self.bump()?;
            self.skip_newlines()?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    fn maybe_close_paren(&mut self, opened: bool) -> Result<(), ParseError> {
        if opened {
            self.skip_newlines()?;
            match self.bump()? {
                Token::CloseParen => Ok(()),
                _ => Err(ParseError::ExpectedCloseParen { line: 0, col: 0 }),
            }
        } else {
            Ok(())
        }
    }

    pub fn parse(&mut self) -> Result<Manifest, ParseError> {
        let mut fx_version = String::new();
        let mut games = Vec::new();
        let mut fields = Vec::new();

        loop {
            self.skip_newlines()?;
            if matches!(self.peek()?, Token::Eof) {
                break;
            }

            let id = match self.bump()? {
                Token::Identifier(id) => id,
                Token::Comment(_) => continue,
                Token::Eof => break,
                _t => {
                    return Err(ParseError::ExpectedIdentifier { line: 0, col: 0 });
                }
            };

            match id.as_str() {
                "fx_version" => {
                    if !fx_version.is_empty() {
                        return Err(ParseError::DuplicateFxVersion { line: 0, col: 0 });
                    }
                    let paren = self.maybe_open_paren()?;
                    fx_version = self.expect_string("fx_version")?;
                    self.maybe_close_paren(paren)?;
                }

                "game" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("game")?;
                    let game = match val.to_lowercase().as_str() {
                        "gta5" => Game::Gta5,
                        "rdr3" => Game::Rdr3,
                        _ => Game::Other(val),
                    };
                    games.push(game);
                    self.maybe_close_paren(paren)?;
                }

                "client_script" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("client_script")?;
                    fields.push(Field::ClientScript(val));
                    self.maybe_close_paren(paren)?;
                }
                "server_script" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("server_script")?;
                    fields.push(Field::ServerScript(val));
                    self.maybe_close_paren(paren)?;
                }
                "shared_script" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("shared_script")?;
                    fields.push(Field::SharedScript(val));
                    self.maybe_close_paren(paren)?;
                }

                "client_scripts" => {
                    let paren = self.maybe_open_paren()?;
                    if matches!(self.peek()?, Token::OpenBrace) {
                        self.bump()?;
                        fields.push(Field::ClientScripts(self.parse_array()?));
                    } else {
                        let val = self.expect_string("client_scripts")?;
                        fields.push(Field::ClientScripts(vec![val]));
                    }
                    self.maybe_close_paren(paren)?;
                }
                "server_scripts" => {
                    let paren = self.maybe_open_paren()?;
                    if matches!(self.peek()?, Token::OpenBrace) {
                        self.bump()?;
                        fields.push(Field::ServerScripts(self.parse_array()?));
                    } else {
                        let val = self.expect_string("server_scripts")?;
                        fields.push(Field::ServerScripts(vec![val]));
                    }
                    self.maybe_close_paren(paren)?;
                }
                "shared_scripts" => {
                    let paren = self.maybe_open_paren()?;
                    if matches!(self.peek()?, Token::OpenBrace) {
                        self.bump()?;
                        fields.push(Field::SharedScripts(self.parse_array()?));
                    } else {
                        let val = self.expect_string("shared_scripts")?;
                        fields.push(Field::SharedScripts(vec![val]));
                    }
                    self.maybe_close_paren(paren)?;
                }

                "files" => {
                    let paren = self.maybe_open_paren()?;
                    if matches!(self.peek()?, Token::OpenBrace) {
                        self.bump()?;
                        fields.push(Field::Files(self.parse_array()?));
                    } else {
                        let val = self.expect_string("files")?;
                        fields.push(Field::Files(vec![val]));
                    }
                    self.maybe_close_paren(paren)?;
                }

                "ui_page" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("ui_page")?;
                    fields.push(Field::UiPage(val));
                    self.maybe_close_paren(paren)?;
                }
                "ui_page_cdn" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("ui_page_cdn")?;
                    fields.push(Field::UiPageCdn(val));
                    self.maybe_close_paren(paren)?;
                }

                "data_file" => {
                    let file_type = self.expect_string("data_file type")?;
                    let path = self.expect_string("data_file path")?;
                    fields.push(Field::DataFile { file_type, path });
                }

                "author" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("author")?;
                    fields.push(Field::Author(val));
                    self.maybe_close_paren(paren)?;
                }
                "description" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("description")?;
                    fields.push(Field::Description(val));
                    self.maybe_close_paren(paren)?;
                }
                "version" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("version")?;
                    fields.push(Field::Version(val));
                    self.maybe_close_paren(paren)?;
                }

                "this_is_a_map" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("this_is_a_map")?;
                    let b = matches!(val.to_lowercase().as_str(), "yes" | "true" | "1");
                    fields.push(Field::ThisIsAMap(b));
                    self.maybe_close_paren(paren)?;
                }

                "lua54" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("lua54")?;
                    fields.push(Field::Lua54(val));
                    self.maybe_close_paren(paren)?;
                }
                "dependency" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("dependency")?;
                    fields.push(Field::Dependency(val));
                    self.maybe_close_paren(paren)?;
                }
                "provide" => {
                    let paren = self.maybe_open_paren()?;
                    let val = self.expect_string("provide")?;
                    fields.push(Field::Provide(val));
                    self.maybe_close_paren(paren)?;
                }

                _ => {
                    let paren = self.maybe_open_paren()?;
                    let value = self.parse_field_value()?;
                    self.maybe_close_paren(paren)?;
                    fields.push(Field::Custom { key: id, value });
                }
            }
        }

        Ok(Manifest {
            fx_version,
            games,
            fields,
        })
    }
}
