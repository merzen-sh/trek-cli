pub mod ast;
pub mod lexer;
pub mod parser;
pub mod source;

use lexer::Lexer;
use parser::Parser;
use source::Source;

pub fn parse(input: &str) -> Result<ast::Manifest, parser::ParseError> {
    let source = Source::new(input);
    let lexer = Lexer::new(&source);
    let mut parser = Parser::new(lexer);
    parser.parse()
}
