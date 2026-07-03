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
        .html_colors(&["#FFFFFF", "#D1D5DB", "#9CA3AF", "#4B5563", "#1F2937"])
        .build::<colorgrad::LinearGradient>()
        .unwrap();

    let lines: Vec<&str> = BANNER.lines().filter(|l| !l.is_empty()).collect();
    let height = lines.len();

    for (y, line) in lines.iter().enumerate() {
        let pos = if height > 1 { y as f32 / (height - 1) as f32 } else { 0.0 };
        let color = grad.at(pos);
        
        let (r, g, b) = (
            (color.r * 255.0) as u8,
            (color.g * 255.0) as u8,
            (color.b * 255.0) as u8,
        );

        print!("\x1b[38;2;{};{};{}m", r, g, b);
        for ch in line.chars() {
            print!("{}", ch);
        }
        println!("\x1b[0m");
    }
}
