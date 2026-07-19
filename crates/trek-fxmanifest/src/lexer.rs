use crate::source::Source;

#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    Identifier(String),
    StringLiteral(String),
    OpenParen,
    CloseParen,
    OpenBrace,
    CloseBrace,
    Comma,
    Newline,
    Comment(String),
    Eof,
}

pub struct Lexer<'a> {
    chars: std::iter::Peekable<std::str::Chars<'a>>,
    pos: usize,
    line: usize,
    col: usize,
}

impl<'a> Lexer<'a> {
    pub fn new(source: &'a Source) -> Self {
        Self {
            chars: source.content().chars().peekable(),
            pos: 0,
            line: 1,
            col: 1,
        }
    }

    fn advance(&mut self) -> Option<char> {
        let c = self.chars.next()?;
        if c == '\n' {
            self.line += 1;
            self.col = 1;
        } else {
            self.col += 1;
        }
        self.pos += 1;
        Some(c)
    }

    fn peek(&mut self) -> Option<&char> {
        self.chars.peek()
    }

    fn skip_whitespace(&mut self) {
        while let Some(&c) = self.peek() {
            if c == ' ' || c == '\t' || c == '\r' {
                self.advance();
            } else {
                break;
            }
        }
    }

    fn read_string(&mut self, quote: char) -> Result<String, LexError> {
        let mut s = String::new();
        loop {
            match self.advance() {
                None => {
                    return Err(LexError::UnterminatedString {
                        line: self.line,
                        col: self.col,
                    });
                }
                Some(c) if c == quote => return Ok(s),
                Some('\\') => match self.advance() {
                    None => {
                        return Err(LexError::UnterminatedString {
                            line: self.line,
                            col: self.col,
                        });
                    }
                    Some('n') => s.push('\n'),
                    Some('t') => s.push('\t'),
                    Some('\\') => s.push('\\'),
                    Some('\'') => s.push('\''),
                    Some('"') => s.push('"'),
                    Some(c) => s.push(c),
                },
                Some(c) => s.push(c),
            }
        }
    }

    fn read_identifier(&mut self) -> String {
        let mut s = String::new();
        while let Some(&c) = self.peek() {
            if c.is_alphanumeric() || c == '_' {
                s.push(self.advance().unwrap());
            } else {
                break;
            }
        }
        s
    }

    fn read_comment(&mut self) -> String {
        let mut s = String::new();
        while let Some(&c) = self.peek() {
            if c == '\n' {
                break;
            }
            s.push(self.advance().unwrap());
        }
        s
    }

    pub fn next_token(&mut self) -> Result<Token, LexError> {
        self.skip_whitespace();

        match self.peek() {
            None => return Ok(Token::Eof),
            Some(&c) => {
                if c == '-' {
                    self.advance();
                    match self.peek() {
                        Some(&'-') => {
                            self.advance();
                            let comment = self.read_comment();
                            return Ok(Token::Comment(comment));
                        }
                        _ => {
                            return Err(LexError::UnexpectedCharacter {
                                ch: '-',
                                line: self.line,
                                col: self.col,
                            });
                        }
                    }
                }

                if c == '\'' || c == '"' {
                    self.advance();
                    let s = self.read_string(c)?;
                    return Ok(Token::StringLiteral(s));
                }

                if c == '(' {
                    self.advance();
                    return Ok(Token::OpenParen);
                }

                if c == ')' {
                    self.advance();
                    return Ok(Token::CloseParen);
                }

                if c == '{' {
                    self.advance();
                    return Ok(Token::OpenBrace);
                }

                if c == '}' {
                    self.advance();
                    return Ok(Token::CloseBrace);
                }

                if c == ',' {
                    self.advance();
                    return Ok(Token::Comma);
                }

                if c == '\n' {
                    self.advance();
                    return Ok(Token::Newline);
                }

                if c.is_alphanumeric() || c == '_' {
                    let ident = self.read_identifier();
                    return Ok(Token::Identifier(ident));
                }

                Err(LexError::UnexpectedCharacter {
                    ch: c,
                    line: self.line,
                    col: self.col,
                })
            }
        }
    }
}

impl<'a> Iterator for Lexer<'a> {
    type Item = Result<Token, LexError>;

    fn next(&mut self) -> Option<Self::Item> {
        match self.next_token() {
            Ok(Token::Eof) => None,
            Ok(t) => Some(Ok(t)),
            Err(e) => Some(Err(e)),
        }
    }
}

#[derive(Debug)]
pub enum LexError {
    UnterminatedString { line: usize, col: usize },
    UnexpectedCharacter { ch: char, line: usize, col: usize },
}

impl std::fmt::Display for LexError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnterminatedString { line, col } => {
                write!(f, "unterminated string at {line}:{col}")
            }
            Self::UnexpectedCharacter { ch, line, col } => {
                write!(f, "unexpected character '{ch}' at {line}:{col}")
            }
        }
    }
}

impl std::error::Error for LexError {}
