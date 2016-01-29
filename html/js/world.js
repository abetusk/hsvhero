
function mainWorld() {
  this.keyFrame=0;
  this.rowFrame=0;

  this.name = "hsvheroine";

  this.delay = 100;

  this.canvas = document.createElement("canvas");
  this.canvas.width = 336;
  this.canvas.height = 576;

  this.ctx = this.canvas.getContext("2d");

  this.scale = 8;

  this.sprite_name = "base_sprite";

  this.sat_ratio = [0.15, 0.15, 0.3];
  this.val_ratio = [0.3, 0.3, 0.6];

  this.random_h_range = 360;
  this.random_h_base = 0;

  this.random_s_range = 1.0;
  this.random_s_base = 0.0;

  this.random_v_range = 1.0;
  this.random_v_base = 0.0;

  // ratios go from current index to next.
  // assumes darkets first.
  // hue is shifted mod 360.
  //
  this.ratio = {
    "tunic" : [ { s:.86, v:1.3, h:0 }, { s:.6, v:1.0, h:225 } ],
    "boot" :  [ { s:1.0, v:1.6, h:0 }, { s:1.0, v:1.7, h:0 } ],
    "pant" : [ { s:1.0, v:1.25, h:0 } ],
    "skin" : [ { s:1.0, v:1.6, h:0 }, { s:2.0, v:0.5, h:150 } ],
    "arm" : [ { s:1.0, v:1.2, h:0 }, { s:1.0, v:1.7, h:0 }]
  };

  this.ok = true;

  this.ele_map = {
    "tunic_0" : "195:87:0:255",
    "tunic_1" : "255:127:35:255",
    "tunic_2" : "161:127:255:255",

    "boot_0" : "123:51:35:255",
    "boot_1" : "196:80:56:255",
    "boot_2" : "229:93:66:255",

    "pant_0" : "128:128:128:255",
    "pant_1" : "160:160:160:255",

    "arm_0" : "114:178:80:255",
    "arm_1" : "135:211:95:255",
    "arm_2" : "158:247:111:255",

    "skin_0" : "79:158:118:255",
    "skin_1" : "127:255:191:255",
    "skin_2" : "127:0:110:255",

    "hair_0" : "0:0:0:255",

    "weapon_0" : "255:233:127:255", // pouch
    "weapon_1" : "213:181:255:255", // sword
    "weapon_2" : "255:201:238:255", // bow
    "weapon_3" : "183:255:194:255", // string
    "weapon_4" : "49:12:255:255", // shield
    "weapon_5" : "137:168:255:255", // shield

    "background" : "255:255:255:0"
    //"background" : "192:192:192:255"
  };

  this.ele_short_name = {};
  this.ele_short_name_rev_lookup = {};

  for (var ele in this.ele_map) {
    if (ele=="background") { continue; }
    var short_name = ele[0] + ele[ele.length-1];
    this.ele_short_name[ele] = short_name;
    this.ele_short_name_rev_lookup[short_name] = ele;
  }

  this.ele_count = { "tunic":3, "boot":3, "pant":2, "arm":3, "skin":3, "hair":1, "weapon":5, "background":1 };

  this.lock_state = "base-shadow-highlight";
  this.lock_arm = false;
  this.lock_boot = false;

  this.color_map = {};
  //this.random_color_map();
  this.reset_color_map();

  var w = 48;
  var h = 48;

  var d = 12;

  this.anim_loop = {
    "idle": { active:false, pos:[ [0,0], [w,0], [2*w,0] ], sz:[[w,h],[w,h],[w,h]], delay:[d,d,d] },
    "walk": { active:false, pos:[ [0,0], [0,h], [w,h], [2*w,h], [3*w,h] ], sz:[[w,h], [w,h],[w,h],[w,h],[w,h]], delay:[d,d,d,d,d] },
    "jump": { active:false, pos:[ [0,0], [0,2*h], [0,3*h], [0,4*h], [0,5*h] ],
                              sz:[[w,h], [w,h],   [w,h],   [w,h],   [w,h]], delay:[d,d,d,d,d] },
    "attack": { active:false, pos:[ [0,0], [0,6*h], [w,6*h], [2*w,6*h] ],
                              sz:[  [w,h], [w,h],   [w,h],   [w,h],   ], delay:[d,d,d,d] },
    "attack-crouch": { active:false, pos:[ [0,0], [0,7*h], [w,7*h], [2*w,7*h] ],
                                     sz:[  [w,h], [w,h],   [w,h],   [w,h],   ], delay:[d,d,d,d] },
    "attack-jump": { active:false, pos:[ [0,0], [0,3*h], [0,8*h], [w,8*h], [0,4*h] ],
                                     sz:[  [w,h], [w,h],   [w,h],   [w,h], [w,h]  ], delay:[d,d,d,d,d] },
    "shield": { active:false, pos:[ [0,0], [0,9*h] ],
                              sz: [ [w,h], [w,h]  ], delay:[d,d] },
    "shield-crouch": { active:false, pos:[ [0,0], [0,10*h] ],
                                     sz: [ [w,h], [w,h],   ], delay:[d,d] },
    "bow": { active:false, pos:[ [0,11*h], [w,11*h], [2*w,11*h], [3*w,11*h], [4*w,11*h], [5*w,11*h] ],
                                     sz: [ [w,h],    [w,h],      [w,h],      [w,h],      [w,h] ], delay:[d,d,d,d,d] },
  };

  this.anim_order = [ "idle", "walk", "jump", "attack", "attack-crouch", "attack-jump", "shield", "shield-crouch", "bow" ];

  this.reset_anim_state();

}

mainWorld.prototype.setDelay = function(delay_ms) {
  if (isNaN(delay_ms) || (delay_ms<=0)) {
    delay_ms = 100;
  }

  var frame_delay = Math.floor(60*delay_ms/1000.0);
  for (var ele in this.anim_loop) {
    for (var ind=0; ind<this.anim_loop[ele].delay.length; ind++) {
      this.anim_loop[ele].delay[ind] = frame_delay;
    }
  }
}

mainWorld.prototype.reset_anim_state = function() {

  this.curFrame = 0;
  this.curAnim = "idle";
  this.curDelay = 0;

  //this.setDelay(100);

}

mainWorld.prototype.reset_color_map = function() {
  this.color_map = {};
  for (var ele in this.ele_map) {
    var rgba_str = this.ele_map[ele].split(":");
    this.color_map[this.ele_map[ele]] = new Uint8ClampedArray(
        [ parseInt(rgba_str[0]),
          parseInt(rgba_str[1]),
          parseInt(rgba_str[2]),
          parseInt(rgba_str[3]) ]);
  }

}

mainWorld.prototype.random_color_map = function() {
  this.color_map = {};
  this.color_map[this.ele_map["background"]] =
    new Uint8ClampedArray([255,255,255,255]);
  for (var ele in this.ele_map) {
    if (ele == "background") { continue; }
    this.color_map[this.ele_map[ele]] = new Uint8ClampedArray(
        [ Math.floor(256*Math.random()),
          Math.floor(256*Math.random()),
          Math.floor(256*Math.random()),
          Math.floor(256*Math.random()) ]);
  }

}

mainWorld.prototype.update_class_color = function(class_color_name) {

  if (this.lock_state == "none") { return; }

  var name_parts = class_color_name.split("_");

  // some kind of error
  //
  if (!(name_parts[0] in this.ele_count)) { return; }

  var class_name = name_parts[0];

  if (class_name == "weapon") { return; }

  // no colors to derive
  //
  if (this.ele_count[class_name] < 2) { return; }

  var updated_idx = parseInt(name_parts[1]);
  var src_str = this.ele_map[class_color_name];
  var val_ar = this.color_map[src_str];

  var rgb_str = val_ar.slice(0,3).join(",");
  var color = tinycolor("rgb(" + rgb_str + ")");
  var hsva = color.toHsv();

  if ((class_name == "boot") && this.lock_boot) {
    var h = hsva.h;
    var s = hsva.s;
    var v = hsva.v;
    for (var ii=0; ii<this.ele_count[class_name]; ii++) {
      var update_class_name = class_name + "_" + ii;
      this.set_color_hsv(update_class_name, class_name + "-color-" + ii, h, s, v);
    }
    return;
  }



  if ((class_name == "arm") && this.lock_arm) {
    var h = hsva.h;
    var s = hsva.s;
    var v = hsva.v;
    for (var ii=0; ii<this.ele_count[class_name]; ii++) {
      var update_class_name = class_name + "_" + ii;
      this.set_color_hsv(update_class_name, class_name + "-color-" + ii, h, s, v);
    }
    return;
  }



  var ratio = this.ratio[class_name];

  if ((this.lock_state == "base-shadow-highlight") || (this.lock_state=="all")) {

    var cur_hue = hsva.h;
    var cur_sat = hsva.s;
    var cur_val = hsva.v;

    for (var ii=(updated_idx-1); ii>=0; ii--) {
      var s = cur_sat / ratio[ii].s;
      if (s >= 1.0) { s = 1.0; }
      else if (s<=0) { s = 0.0; }

      var v = cur_val / ratio[ii].v;
      if (v >= 1.0) { v = 1.0; }
      else if (v<=0) { v=0.0; }

      var h = (cur_hue - ratio[ii].h + 360)%360;

      var update_class_name = class_name + "_" + ii;

      this.set_color_hsv(update_class_name, class_name + "-color-" + ii, h, s, v);

      cur_hue = h;
      cur_sat = s;
      cur_val = v;
    }

    var cur_hue = hsva.h;
    var cur_sat = hsva.s;
    var cur_val = hsva.v;

    for (var ii=(updated_idx+1); ii<this.ele_count[class_name]; ii++) {
      var h = (cur_hue + ratio[ii-1].h + 360)%360;
      var s = cur_sat * ratio[ii-1].s;
      if (s>=1.0) { s=1.0; } else if (s<=0.0) { s=0.0; }
      var v = cur_val * ratio[ii-1].v;
      if (v>=1.0) { v=1.0; } else if (v<=0.0) { v=0.0; }
      var update_class_name = class_name + "_" + ii;
      this.set_color_hsv(update_class_name, class_name + "-color-" + ii, h, s, v);
      cur_hue = h;
      cur_sat = s;
      cur_val = v;
    }

  }

  else if (this.lock_state == "base-shadow") {
  }

  else if (this.lock_state == "shadow-highlight") {
  }

  else if (this.lock_state == "none") {
  }

}

mainWorld.prototype.set_color_hsv = function(class_name, html_ele_id, h, s, v) {

  var new_hsv = tinycolor("hsv(" + h + "," + s + "," + v + ")");
  var rgb = new_hsv.toRgb();

  var src_color = this.ele_map[class_name]
  this.color_map[src_color] =
     new Uint8ClampedArray([ Math.floor(rgb.r),
                             Math.floor(rgb.g),
                             Math.floor(rgb.b), 255 ]);

  var thsv = new_hsv.toHsv();
  hsv_str = "hsv(" + Math.floor(thsv.h) + "," + thsv.s + "," + thsv.v + ")";

  $("#" + html_ele_id).spectrum("set", hsv_str);
}

mainWorld.prototype.set_color_rgb = function(class_name, html_ele_id, r, g, b) {

  var new_rgb = tinycolor("rgb(" + r + "," + g + "," + b + ")");
  var rgb = new_rgb.toRgb();

  var src_color = this.ele_map[class_name]
  this.color_map[src_color] =
     new Uint8ClampedArray([ Math.floor(rgb.r),
                             Math.floor(rgb.g),
                             Math.floor(rgb.b), 255 ]);

  var thsv = new_rgb.toHsv();
  hsv_str = "hsv(" + Math.floor(thsv.h) + "," + thsv.s + "," + thsv.v + ")";
  $("#" + html_ele_id).spectrum("set", hsv_str);
}



mainWorld.prototype.animLoop = function(anim_type, flag) {
  this.anim_loop[anim_type].active = flag;
}

mainWorld.prototype.blit = function() {

  var cnv = g_painter.canvas;
  var ctx = g_painter.context;

  var x = ctx.createImageData(cnv.width, cnv.height);
  var n = x.data.length;
  for (var i=0; i<n; i++) {
    x.data[i] = this.rgba.data[i];
    if (x.data[i] == 192) {
      x.data[i] = 3;
    }
  }

  this.disp_ctx = ctx;
  this.test_img = x;

  ctx.putImageData(x,0,0);

}

mainWorld.prototype.fill = function() {

  this.ctx.drawImage(g_imgcache.image["base_sprite"].image, 0, 0);

  this.src_rgba = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  this.dst_rgba = this.ctx.createImageData(this.canvas.width, this.canvas.height);

  var n = this.src_rgba.data.length;

  for (var i=0; i<n; i+=4) {

    var r = this.src_rgba.data[i+0];
    var g = this.src_rgba.data[i+1];
    var b = this.src_rgba.data[i+2];
    var a = this.src_rgba.data[i+3];

    var dst_pix = [r,g,b,a];

    var key = r + ":" + g + ":" + b + ":" + a;

    if (key in this.color_map) {
      dst_pix = new Uint8ClampedArray(this.color_map[key]);
    }

    this.dst_rgba.data[i+0] = dst_pix[0];
    this.dst_rgba.data[i+1] = dst_pix[1];
    this.dst_rgba.data[i+2] = dst_pix[2];
    this.dst_rgba.data[i+3] = dst_pix[3];

  }

  this.ctx.putImageData(this.dst_rgba,0,0);

  var img_url_data = this.canvas.toDataURL();
  g_imgcache.addImgData("sprite", img_url_data);

  this.ok = false;

  this.sprite_name = "sprite";
}

mainWorld.prototype.update = function() {
  var on_count=0;
  var next_anim_flag = false;

  this.curDelay++;

  var p = this.anim_loop[this.curAnim];

  if (p.active) {
    if (this.curDelay >= p.delay[this.curFrame]) {
      this.curDelay = 0;
      this.curFrame++;
      if (this.curFrame >= p.delay.length) {
        this.curFrame=0;

        next_anim_flag = true;
      }
    }
  }

  var bfr = this.anim_order[0];
  var nxt = this.anim_order[0];

  var first_ind = -1;
  var cur_ind = -1;

  for (var ind=0; ind<this.anim_order.length; ind++) {
    var ele = this.anim_order[ind];
    if (!this.anim_loop[ele].active) {
      continue;
    }
    on_count++;

    if (first_ind<0) { first_ind = ind; }
    if (ele == this.curAnim) { cur_ind = ind; }
  }

  if (on_count==0) {
    this.reset_anim_state();
    return;
  }

  if (cur_ind<0) {
    this.curFrame = 0;
    this.curAnim = this.anim_order[first_ind];
    this.curDelay = 0;
    return;
  }

  if (next_anim_flag) {

    var bfr_ind = -1;
    var nxt_ind = -1;

    for (var ind=0; ind<this.anim_order.length; ind++) {
      var ele = this.anim_order[ind];
      if (!this.anim_loop[ele].active) { continue; }
      if (bfr_ind < cur_ind) { bfr_ind = ind; }
      if ((nxt_ind<0) && (ind>cur_ind)) { nxt_ind = ind; }
    }

    if (nxt_ind>=0) {
      this.curFrame = 0;
      this.curAnim = this.anim_order[nxt_ind];
      this.curDelay = 0;
    } else if (first_ind>=0) {
      this.curFrame = 0;
      this.curAnim = this.anim_order[first_ind];
      this.curDelay = 0;
    } else {
      console.log("arg...", cur_ind);
    }

  }

}

mainWorld.prototype.draw = function() {


  var imgx = this.anim_loop[this.curAnim].pos[this.curFrame][0];
  var imgy = this.anim_loop[this.curAnim].pos[this.curFrame][1];
  var imgw = this.anim_loop[this.curAnim].sz[this.curFrame][0];
  var imgh = this.anim_loop[this.curAnim].sz[this.curFrame][1];

  //var imgx = 0;
  //var imgy = 0;
  //var imgw = 16;
  //var imgh = 32;

  var wx = 0;
  var wy = 0;
  var ww = Math.floor(this.scale*imgw);
  var wh = Math.floor(this.scale*imgh);

  var ang = 0;
  var alpha = 1;

  var dst_color = this.color_map[ this.ele_map["background"] ];
  var r = dst_color[0];
  var g = dst_color[1];
  var b = dst_color[2];
  var a = dst_color[3]/255.0;

  g_painter.startDrawColor_a("rgb(255,255,255)");
  g_painter.fillRect(0, 0, 1024, 1024, "rgba("  + r + "," + g + "," + b + "," + a + ")");
  g_imgcache.draw_s(this.sprite_name, imgx, imgy, imgw, imgh, wx, wy, ww, wh, ang, alpha);
  g_painter.endDraw();

}
