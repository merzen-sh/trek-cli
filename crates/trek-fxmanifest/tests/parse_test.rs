#[test]
fn parse_sample_manifest() {
    let input = r#"
fx_version 'cerulean'
game 'gta5'
game 'rdr3'

author 'John Doe'
description 'My awesome script'
version '1.0.0'

client_script 'client.lua'
server_script 'server.lua'

client_scripts {
    'client/main.lua',
    'client/utils.lua',
}

files {
    'html/index.html',
    'html/style.css',
}

data_file 'HANDLING_FILE' 'handling.meta'
this_is_a_map 'yes'
"#;

    let manifest = trek_fxmanifest::parse(input).unwrap();

    assert_eq!(manifest.fx_version, "cerulean");
    assert_eq!(manifest.games.len(), 2);
    assert!(matches!(
        manifest.games[0],
        trek_fxmanifest::ast::Game::Gta5
    ));
    assert!(matches!(
        manifest.games[1],
        trek_fxmanifest::ast::Game::Rdr3
    ));

    let mut client_scripts = Vec::new();
    let mut files = Vec::new();

    for field in &manifest.fields {
        match field {
            trek_fxmanifest::ast::Field::Author(a) => assert_eq!(a, "John Doe"),
            trek_fxmanifest::ast::Field::Description(d) => assert_eq!(d, "My awesome script"),
            trek_fxmanifest::ast::Field::Version(v) => assert_eq!(v, "1.0.0"),
            trek_fxmanifest::ast::Field::ClientScript(s) => assert_eq!(s, "client.lua"),
            trek_fxmanifest::ast::Field::ServerScript(s) => assert_eq!(s, "server.lua"),
            trek_fxmanifest::ast::Field::ClientScripts(s) => {
                client_scripts.extend(s.iter().cloned())
            }
            trek_fxmanifest::ast::Field::Files(f) => files.extend(f.iter().cloned()),
            trek_fxmanifest::ast::Field::DataFile { file_type, path } => {
                assert_eq!(file_type, "HANDLING_FILE");
                assert_eq!(path, "handling.meta");
            }
            trek_fxmanifest::ast::Field::ThisIsAMap(b) => assert!(b),
            _ => {}
        }
    }

    assert_eq!(client_scripts, vec!["client/main.lua", "client/utils.lua"]);
    assert_eq!(files, vec!["html/index.html", "html/style.css"]);
}

#[test]
fn parse_empty_manifest() {
    let input = "";
    let manifest = trek_fxmanifest::parse(input).unwrap();
    assert_eq!(manifest.fx_version, "");
    assert!(manifest.games.is_empty());
    assert!(manifest.fields.is_empty());
}

#[test]
fn parse_with_comments() {
    let input = r#"
-- This is a comment
fx_version 'cerulean' -- inline comment
game 'gta5'
"#;
    let manifest = trek_fxmanifest::parse(input).unwrap();
    assert_eq!(manifest.fx_version, "cerulean");
    assert_eq!(manifest.games.len(), 1);
}

#[test]
fn parse_custom_field() {
    let input = r#"
fx_version 'cerulean'
game 'gta5'
my_custom_key 'custom_value'
"#;
    let manifest = trek_fxmanifest::parse(input).unwrap();
    let custom = manifest.fields.iter().find(
        |f| matches!(f, trek_fxmanifest::ast::Field::Custom { key, .. } if key == "my_custom_key"),
    );
    assert!(custom.is_some());
    if let Some(trek_fxmanifest::ast::Field::Custom { value, .. }) = custom {
        assert!(matches!(value, trek_fxmanifest::ast::Value::String(s) if s == "custom_value"));
    }
}

#[test]
fn parse_double_quoted_strings() {
    let input = r#"fx_version "cerulean"
game "gta5"
"#;
    let manifest = trek_fxmanifest::parse(input).unwrap();
    assert_eq!(manifest.fx_version, "cerulean");
    assert_eq!(manifest.games.len(), 1);
}
