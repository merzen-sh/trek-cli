use colorgrad::Gradient;

const BANNER: &str = "
    ████████╗██████╗ ███████╗██╗  ██╗
    ╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
       ██║   ██████╔╝█████╗  █████╔╝ 
       ██║   ██╔══██╗██╔══╝  ██╔═██╗ 
       ██║   ██║  ██║███████╗██║  ██╗
       ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝";

pub fn print_banner() {
    let grad = colorgrad::GradientBuilder::new()
        .html_colors(&["#2A7B9B", "#57C785", "#EDDD53"])
        .build::<colorgrad::LinearGradient>()
        .unwrap();

    let lines: Vec<&str> = BANNER.lines().collect();
    let height = lines.len();
    let max_width = lines.iter().map(|l| l.chars().count()).max().unwrap_or(1);

    for (y, line) in lines.iter().enumerate() {
        for (x, ch) in line.chars().enumerate() {
            let pos = (x + y) as f32 / (max_width + height) as f32;
            let pos = pos.clamp(0.0, 1.0);

            let color = grad.at(pos);
            let (r, g, b) = (
                (color.r * 255.0) as u8,
                (color.g * 255.0) as u8,
                (color.b * 255.0) as u8,
            );

            print!("\x1b[38;2;{};{};{}m{}\x1b[0m", r, g, b, ch);
        }
        println!();
    }
}
