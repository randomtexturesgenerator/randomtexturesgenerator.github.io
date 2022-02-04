"use strict";
/* +--------------------------------------------+ */
/* |          RandomTexturesGenerator           | */
/* |                   art.ts                   | */
/* | (c)copyright nitram147 [Martin Ersek] 2022 | */
/* +--------------------------------------------+ */
function get_random_float(min, max) {
    return Math.random() * (max - min) + min;
}
function get_random_int(min, max) {
    return Math.floor(get_random_float(min, max));
}
function from_polar(v, alpha) {
    return [v * Math.cos(alpha), v * Math.sin(alpha)];
}
function clamp_value(value, min, max) {
    return ((value < min) ? min : ((value > max) ? max : value));
}
;
//for each 500x500 pixels area, there will be 200 particles
const particles_count = Math.floor(((window.innerWidth * window.innerHeight) / (500 * 500)) * 200);
const color_palettes = [
    ["#247BA0", "#70C1B3", "#B2DBBF", "#F3FFBD", "#FF1654"],
    ["#6A0136", "#BFAB25", "#B81365", "#026C7C", "#055864"],
    ["#FFBF00", "#E83F6F", "#2274A5", "#32936F", "#FFFFFF"],
    ["#C05746", "#ADC698", "#D0E3C4", "#FFFFFF", "#503047"],
    ["#2E1F27", "#854D27", "#DD7230", "#F4C95D", "#E7E393"]
];
;
function parse_filling_style(value) {
    switch (value) {
        case "worms":
            return 0 /* Worms */;
            break;
        case "crystals":
            return 1 /* Crystals */;
            break;
        case "lasers":
            return 2 /* Lasers */;
            break;
        case "bullets":
            return 3 /* Bullets */;
            break;
        case "boxes":
            return 4 /* Boxes */;
            break;
        default: break;
    }
    return 0 /* Worms */;
}
let new_filling_style = 0;
let filling_style_changed = false;
let runtime_paused = false;
let runtime_reset = false;
let refresh_rate = 1000 / 50;
let ms_elapsed = 0;
let current_color_palette_id = 0;
let current_color_palette_changed = false;
function auto_reset_canvas() {
    return document.getElementById("aryes").checked;
}
let wrm_radius_min = 0.05;
let wrm_radius_max = 3.00;
let wrm_lifetime_min = 25;
let wrm_lifetime_max = 50;
let crstl_radius_min = 0.05;
let crstl_radius_max = 2.00;
let crstl_total_length_min = 10;
let crstl_total_length_max = 30;
let lsr_length_min = 30;
let lsr_length_max = 50;
let lsr_thickness_min = 1;
let lsr_thickness_max = 3;
let blt_radius_min = 0.05;
let blt_radius_max = 3.00;
let bx_wh_min = 2;
let bx_wh_max = 8;
function import_values_from_advanced_options() {
    wrm_radius_min = Number(document.getElementById("wrm_radius_min").value);
    wrm_radius_max = Number(document.getElementById("wrm_radius_max").value);
    wrm_lifetime_min = Number(document.getElementById("wrm_lifetime_min").value);
    wrm_lifetime_max = Number(document.getElementById("wrm_lifetime_max").value);
    crstl_radius_min = Number(document.getElementById("crstl_radius_min").value);
    crstl_radius_max = Number(document.getElementById("crstl_radius_max").value);
    crstl_total_length_min = Number(document.getElementById("crstl_total_length_min").value);
    crstl_total_length_max = Number(document.getElementById("crstl_total_length_max").value);
    lsr_length_min = Number(document.getElementById("lsr_length_min").value);
    lsr_length_max = Number(document.getElementById("lsr_length_max").value);
    lsr_thickness_min = Number(document.getElementById("lsr_thickness_min").value);
    lsr_thickness_max = Number(document.getElementById("lsr_thickness_max").value);
    blt_radius_min = Number(document.getElementById("blt_radius_min").value);
    blt_radius_max = Number(document.getElementById("blt_radius_max").value);
    bx_wh_min = Number(document.getElementById("bx_wh_min").value);
    bx_wh_max = Number(document.getElementById("bx_wh_max").value);
}
class Simulator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.particles = [];
        this.palette = [];
        this.already_initialized = false;
        current_color_palette_id = get_random_int(0, color_palettes.length);
        this.palette = color_palettes[current_color_palette_id];
        for (let i = 0; i < particles_count; ++i) {
            this.particles.push(new WormParticle(this.width, this.height, this.palette));
        }
    }
    change_palette(palette) {
        this.palette = palette;
    }
    update() {
        ms_elapsed += 1;
        if (current_color_palette_changed) {
            this.palette = color_palettes[current_color_palette_id];
            this.particles.forEach(p => p.change_palette(color_palettes[current_color_palette_id]));
            current_color_palette_changed = false;
        }
        if (ms_elapsed % refresh_rate)
            return;
        if (runtime_paused)
            return;
        this.particles.forEach(p => p.update());
    }
    draw(ctx) {
        if (ms_elapsed % refresh_rate)
            return;
        if ((!(this.already_initialized)) || (filling_style_changed && auto_reset_canvas()) || runtime_reset) {
            ctx.fillStyle = this.palette[0];
            ctx.fillRect(0, 0, this.width, this.height);
            this.already_initialized = true;
        }
        if (runtime_reset) {
            runtime_reset = false;
            runtime_paused = true;
            document.getElementById("pause_resume_btn").innerHTML = "Resume";
            return;
        }
        if (runtime_paused)
            return;
        if (filling_style_changed) {
            this.particles = [];
            for (let i = 0; i < particles_count; ++i) {
                switch (new_filling_style) {
                    case 0 /* Worms */:
                        this.particles.push(new WormParticle(this.width, this.height, this.palette));
                        break;
                    case 1 /* Crystals */:
                        this.particles.push(new CrystalParticle(this.width, this.height, this.palette));
                        break;
                    case 2 /* Lasers */:
                        this.particles.push(new LaserParticle(this.width, this.height, this.palette));
                        break;
                    case 3 /* Bullets */:
                        this.particles.push(new BulletParticle(this.width, this.height, this.palette));
                        break;
                    case 4 /* Boxes */:
                        this.particles.push(new BoxParticle(this.width, this.height, this.palette));
                        break;
                    default: break;
                }
            }
            filling_style_changed = false;
        }
        this.particles.forEach(p => p.draw(ctx));
    }
}
class WormParticle {
    constructor(w, h, palette) {
        this.w = w;
        this.h = h;
        this.palette = palette;
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.alpha = 0;
        this.radius = 1.0;
        this.ttl = 500;
        this.lifetime = 500;
        this.color = "black";
        this.init();
    }
    init() {
        import_values_from_advanced_options();
        this.x = get_random_float(0, this.w);
        this.y = get_random_float(0, this.h);
        this.speed = get_random_float(0, 3.0);
        this.alpha = get_random_float(0, (2.0 * Math.PI));
        this.radius = get_random_float(wrm_radius_min, wrm_radius_max);
        this.lifetime = this.ttl = get_random_int(wrm_lifetime_min, wrm_lifetime_max);
        this.color = this.palette[get_random_int(0, this.palette.length)];
    }
    change_palette(palette) {
        this.palette = palette;
    }
    update() {
        if (this.ttl) {
            const dradius = get_random_float(-3.0 / 10, 3.0 / 10);
            const dspeed = get_random_float(-0.01, 0.01);
            const dalpha = get_random_float(-Math.PI / 8, Math.PI / 8);
            this.speed += dspeed;
            this.alpha += dalpha;
            const [dx, dy] = from_polar(this.speed, this.alpha);
            this.x = clamp_value(this.x + dx, 0, this.w);
            this.y = clamp_value(this.y + dy, 0, this.h);
            this.radius += dradius;
            this.radius += (this.radius < 0) ? (-2 * dradius) : 0;
            this.ttl = clamp_value(this.ttl - 1, 0, 500);
            if ((!this.ttl)) {
                this.ttl = 500;
                this.init();
            }
        }
    }
    draw(ctx) {
        ctx.save();
        this.experiment1(ctx);
        ctx.restore();
    }
    experiment1(ctx) {
        ctx.fillStyle = this.color;
        let circle = new Path2D();
        circle.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill(circle);
    }
}
class CrystalParticle {
    constructor(w, h, palette) {
        this.w = w;
        this.h = h;
        this.palette = palette;
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.alpha = 0;
        this.radius = 1.0;
        this.total_length = 0;
        this.progress = 0;
        this.color = "black";
        this.init();
    }
    init() {
        import_values_from_advanced_options();
        this.x = get_random_float(0, this.w);
        this.y = get_random_float(0, this.h);
        this.total_length = get_random_int(crstl_total_length_min, crstl_total_length_max);
        this.progress = 0;
        this.speed = get_random_float(0, 3.0);
        this.alpha = get_random_float(0, (2.0 * Math.PI));
        this.radius = get_random_float(crstl_radius_min, crstl_radius_max);
        this.color = this.palette[get_random_int(0, this.palette.length)];
    }
    change_palette(palette) {
        this.palette = palette;
    }
    update() {
        if (this.progress != this.total_length) {
            const [dx, dy] = from_polar(this.speed, this.alpha);
            this.x = clamp_value(this.x + dx, 0, this.w);
            this.y = clamp_value(this.y + dy, 0, this.h);
            this.radius *= 1.0 + ((this.progress < (this.total_length / 2)) ? 0.05 : -0.05);
            this.progress += 1;
            if (this.progress >= this.total_length) {
                this.init();
            }
        }
    }
    draw(ctx) {
        ctx.save();
        this.experiment1(ctx);
        ctx.restore();
    }
    experiment1(ctx) {
        ctx.fillStyle = this.color;
        let circle = new Path2D();
        circle.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill(circle);
    }
}
class LaserParticle {
    constructor(w, h, palette) {
        this.w = w;
        this.h = h;
        this.palette = palette;
        this.x = 0;
        this.y = 0;
        this.length = 0;
        this.thickness = 0;
        this.radius = 1.0;
        this.direction = 0;
        this.color = "black";
        this.init();
    }
    init() {
        import_values_from_advanced_options();
        this.x = get_random_float(0, this.w);
        this.y = get_random_float(0, this.h);
        this.length = get_random_int(lsr_length_min, lsr_length_max);
        this.thickness = get_random_int(lsr_thickness_min, lsr_thickness_max);
        this.direction = get_random_int(0, 2); //todo fix randint function...
        this.color = this.palette[get_random_int(0, this.palette.length)];
    }
    change_palette(palette) {
        this.palette = palette;
    }
    update() {
        this.init();
        this.x = clamp_value(this.x, 0, this.w);
        this.y = clamp_value(this.y, 0, this.h);
    }
    draw(ctx) {
        ctx.save();
        this.experiment1(ctx);
        ctx.restore();
    }
    experiment1(ctx) {
        ctx.fillStyle = this.color;
        let rectangle = new Path2D();
        if (this.direction) {
            rectangle.rect(this.x, this.y, this.thickness, this.length);
        }
        else {
            rectangle.rect(this.x, this.y, this.length, this.thickness);
        }
        ctx.fill(rectangle);
    }
}
class BulletParticle {
    constructor(w, h, palette) {
        this.w = w;
        this.h = h;
        this.palette = palette;
        this.x = 0;
        this.y = 0;
        this.radius = 1.0;
        this.color = "black";
        this.init();
    }
    init() {
        import_values_from_advanced_options();
        this.x = get_random_float(0, this.w);
        this.y = get_random_float(0, this.h);
        this.radius = get_random_float(blt_radius_min, blt_radius_max);
        this.color = this.palette[get_random_int(0, this.palette.length)];
    }
    change_palette(palette) {
        this.palette = palette;
    }
    update() {
        this.init();
        this.x = clamp_value(this.x, 0, this.w);
        this.y = clamp_value(this.y, 0, this.h);
    }
    draw(ctx) {
        ctx.save();
        this.experiment1(ctx);
        ctx.restore();
    }
    experiment1(ctx) {
        ctx.fillStyle = this.color;
        let circle = new Path2D();
        circle.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill(circle);
    }
}
class BoxParticle {
    constructor(w, h, palette) {
        this.w = w;
        this.h = h;
        this.palette = palette;
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.radius = 1.0;
        this.color = "black";
        this.init();
    }
    init() {
        import_values_from_advanced_options();
        this.x = get_random_float(0, this.w);
        this.y = get_random_float(0, this.h);
        this.width = get_random_int(bx_wh_min, bx_wh_max);
        this.height = get_random_int(bx_wh_min, bx_wh_max);
        this.color = this.palette[get_random_int(0, this.palette.length)];
    }
    change_palette(palette) {
        this.palette = palette;
    }
    update() {
        this.init();
        this.x = clamp_value(this.x, 0, this.w);
        this.y = clamp_value(this.y, 0, this.h);
    }
    draw(ctx) {
        ctx.save();
        this.experiment1(ctx);
        ctx.restore();
    }
    experiment1(ctx) {
        ctx.fillStyle = this.color;
        let rectangle = new Path2D();
        rectangle.rect(this.x, this.y, this.width, this.height);
        ctx.fill(rectangle);
    }
}
function filling_style_change_callback() {
    const filling_styles_select = document.getElementById("filling_styles");
    const value = filling_styles_select.options[filling_styles_select.selectedIndex].value;
    new_filling_style = parse_filling_style(value);
    filling_style_changed = true;
}
function pause_resume_btn_click_callback() {
    const pause_resume_btn = document.getElementById("pause_resume_btn");
    if (pause_resume_btn.innerHTML === "Pause") {
        runtime_paused = true;
        pause_resume_btn.innerHTML = "Resume";
    }
    else {
        runtime_paused = false;
        pause_resume_btn.innerHTML = "Pause";
    }
}
function reset_btn_click_callback() {
    runtime_reset = true;
}
function save_png_btn_click_callback() {
    runtime_paused = true;
    document.getElementById("pause_resume_btn").innerHTML = "Resume";
    const art_canvas = document.getElementById("art_canvas");
    const save_link = document.getElementById("save_link");
    const png_name = prompt("Please choose PNG file name", "unnamed") + ".png";
    save_link.setAttribute("download", png_name);
    save_link.setAttribute("href", art_canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
    save_link.click();
}
function render_speed_change_callback() {
    refresh_rate = Math.floor(1000 / (Number(document.getElementById("render_speed").value)));
    ms_elapsed = 0;
}
function current_color_palette_change_callback() {
    const current_color_palette = document.getElementById("current_color_palette");
    const value = current_color_palette.options[current_color_palette.selectedIndex].value;
    current_color_palette_id = Number(value);
    current_color_palette_changed = true;
}
function show_hide_options_btn_click_callback() {
    const show_hide_options_btn = document.getElementById("show_hide_options_btn");
    if (show_hide_options_btn.innerHTML === "Show advanced options") {
        document.getElementById("advanced_options").style.display = "block";
        show_hide_options_btn.innerHTML = "Hide advanced options";
    }
    else {
        document.getElementById("advanced_options").style.display = "none";
        show_hide_options_btn.innerHTML = "Show advanced options";
    }
}
function init_app() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("id", "art_canvas");
    document.body.appendChild(canvas);
    if (!canvas)
        return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    //antialias
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const sim = new Simulator(width, height);
    setInterval(() => { sim.update(); }, 1);
    setInterval(() => { sim.draw(ctx); }, 1);
    const filling_styles_select = document.getElementById("filling_styles");
    filling_styles_select.addEventListener("change", filling_style_change_callback);
    const pause_resume_btn = document.getElementById("pause_resume_btn");
    pause_resume_btn.addEventListener("click", pause_resume_btn_click_callback);
    const reset_btn = document.getElementById("reset_btn");
    reset_btn.addEventListener("click", reset_btn_click_callback);
    const save_png_btn = document.getElementById("save_png_btn");
    save_png_btn.addEventListener("click", save_png_btn_click_callback);
    const render_speed = document.getElementById("render_speed");
    render_speed.addEventListener("change", render_speed_change_callback);
    render_speed.addEventListener("input", render_speed_change_callback);
    const current_color_palette = document.getElementById("current_color_palette");
    for (let i = 0; i < color_palettes.length; ++i) {
        const option = document.createElement("option");
        option.value = String(i);
        option.text = "Palette " + String(i);
        if (i === current_color_palette_id) {
            option.setAttribute("selected", "selected");
        }
        current_color_palette.appendChild(option);
    }
    current_color_palette.addEventListener("change", current_color_palette_change_callback);
    const show_hide_options_btn = document.getElementById("show_hide_options_btn");
    show_hide_options_btn.addEventListener("click", show_hide_options_btn_click_callback);
}
init_app();
