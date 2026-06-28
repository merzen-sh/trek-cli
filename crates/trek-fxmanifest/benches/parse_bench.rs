use criterion::{Criterion, criterion_group, criterion_main};
use std::hint::black_box;

const SMALL: &str = r#"
fx_version 'cerulean'
game 'gta5'
author 'John Doe'
description 'My script'
version '1.0.0'
client_script 'client.lua'
server_script 'server.lua'
"#;

const MEDIUM: &str = r#"
fx_version 'cerulean'
game 'gta5'
game 'rdr3'

author 'John Doe'
description 'A comprehensive FiveM script with many features'
version '2.1.0'

client_script 'client.lua'
client_script 'client_utils.lua'
server_script 'server.lua'
server_script 'server_utils.lua'
shared_script 'config.lua'

client_scripts {
    'client/main.lua',
    'client/events.lua',
    'client/nui.lua',
    'client/helpers.lua',
    'client/vehicles.lua',
}

server_scripts {
    'server/main.lua',
    'server/commands.lua',
    'server/database.lua',
    'server/player.lua',
    'server/admin.lua',
}

shared_scripts {
    'shared/config.lua',
    'shared/constants.lua',
    'shared/locales.lua',
}

files {
    'html/index.html',
    'html/style.css',
    'html/app.js',
    'html/assets/icon.png',
    'html/assets/font.woff2',
}

ui_page 'html/index.html'
ui_page_cdn 'https://cdn.example.com/ui.zip'

data_file 'HANDLING_FILE' 'data/handling.meta'
data_file 'VEHICLE_METADATA_FILE' 'data/vehicles.meta'
data_file 'CARCOLS_FILE' 'data/carcols.meta'
data_file 'VEHICLE_VARIATION_FILE' 'data/carvariations.meta'

this_is_a_map 'yes'
lua54 'yes'
dependency 'essential-mode'
provide 'my-old-resource'

-- Additional metadata
tags 'roleplay', 'economy', 'jobs'
-- This is a comment explaining something
"#;

const LARGE: &str = r#"
fx_version 'cerulean'
game 'gta5'
game 'rdr3'

author 'Jane Smith'
description 'Large-scale roleplay framework with dozens of modules'
version '4.7.2'

client_script 'core/client.lua'
server_script 'core/server.lua'
shared_script 'core/shared.lua'

client_scripts {
    'modules/auth/client.lua',
    'modules/economy/client.lua',
    'modules/vehicles/client.lua',
    'modules/housing/client.lua',
    'modules/jobs/client.lua',
    'modules/phone/client.lua',
    'modules/inventory/client.lua',
    'modules/garage/client.lua',
    'modules/911/client.lua',
    'modules/racing/client.lua',
    'modules/gangs/client.lua',
    'modules/banking/client.lua',
    'modules/radio/client.lua',
    'modules/weather/client.lua',
    'modules/admin/client.lua',
    'modules/debug/client.lua',
}

server_scripts {
    'modules/auth/server.lua',
    'modules/economy/server.lua',
    'modules/vehicles/server.lua',
    'modules/housing/server.lua',
    'modules/jobs/server.lua',
    'modules/phone/server.lua',
    'modules/inventory/server.lua',
    'modules/garage/server.lua',
    'modules/911/server.lua',
    'modules/racing/server.lua',
    'modules/gangs/server.lua',
    'modules/banking/server.lua',
    'modules/radio/server.lua',
    'modules/weather/server.lua',
    'modules/admin/server.lua',
    'modules/debug/server.lua',
    'modules/whitelist/server.lua',
    'modules/logging/server.lua',
    'modules/anticheat/server.lua',
}

shared_scripts {
    'config.lua',
    'locales/en.lua',
    'locales/fr.lua',
    'locales/de.lua',
    'locales/es.lua',
    'locales/pt.lua',
    'shared/constants.lua',
    'shared/functions.lua',
    'shared/events.lua',
}

files {
    'web/build/index.html',
    'web/build/static/js/main.js',
    'web/build/static/css/style.css',
    'web/build/static/media/logo.png',
    'web/build/static/media/bg.jpg',
    'web/build/static/media/icon.svg',
    'web/build/static/media/font.woff2',
    'web/build/static/media/font.woff',
    'stream/*.yft',
    'stream/*.ytd',
    'stream/*.ydr',
    'stream/*.ydd',
    'data/handling.meta',
    'data/vehicles.meta',
    'data/carcols.meta',
    'data/carvariations.meta',
    'data/dlctext.meta',
}

ui_page 'web/build/index.html'

data_file 'HANDLING_FILE' 'data/handling.meta'
data_file 'VEHICLE_METADATA_FILE' 'data/vehicles.meta'
data_file 'CARCOLS_FILE' 'data/carcols.meta'
data_file 'VEHICLE_VARIATION_FILE' 'data/carvariations.meta'
data_file 'DLCTEXT_FILE' 'data/dlctext.meta'

this_is_a_map 'yes'
lua54 'yes'
dependency 'essential-mode'
dependency 'ox_lib'
dependency 'oxmysql'
provide 'my-old-resource'
"#;

fn bench_small(c: &mut Criterion) {
    c.bench_function("parse small", |b| {
        b.iter(|| trek_fxmanifest::parse(black_box(SMALL)))
    });
}

fn bench_medium(c: &mut Criterion) {
    c.bench_function("parse medium", |b| {
        b.iter(|| trek_fxmanifest::parse(black_box(MEDIUM)))
    });
}

fn bench_large(c: &mut Criterion) {
    c.bench_function("parse large", |b| {
        b.iter(|| trek_fxmanifest::parse(black_box(LARGE)))
    });
}

criterion_group!(benches, bench_small, bench_medium, bench_large);
criterion_main!(benches);
