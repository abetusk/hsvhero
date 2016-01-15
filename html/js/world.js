
function mainWorld() {
  this.keyFrame=0;
  this.rowFrame=0;

  this.name = "hsvheroine";

  this.delay = 100;

  this.canvas = document.createElement("canvas");
  this.canvas.width = 256;
  this.canvas.height = 512;

  this.ctx = this.canvas.getContext("2d");

  this.scale = 16;

  this.sprite_name = "base_sprite";

  this.ok = true;

  this.ele_map = {
    "tunic_0" : "255:127:35:255",
    "tunic_1" : "195:87:0:255",
    "tunic_2" : "161:127:255:255",

    "boot_0" : "123:51:35:255",

    "pant_0" : "160:160:160:255",
    "pant_1" : "128:128:128:255",

    "arm_0" : "114:178:80:255",

    "skin_0" : "127:255:191:255",
    "skin_1" : "79:158:118:255",
    "skin_2" : "127:0:110:255",

    "hair_0" : "0:0:0:255",

    "weapon_0" : "255:233:127:255",
    "weapon_1" : "213:181:255:255",
    "weapon_2" : "255:225:170:255",
    "weapon_3" : "183:255:194:255",
    "weapon_4" : "255:201:238:255",

    "background" : "192:192:192:255"
  };


  this.color_map = {};
  //this.random_color_map();
  this.reset_color_map();

  this.anim_loop = {
    "idle": { active:false, pos:[ [0,0], [16,0], [32,0] ], sz:[[16,32],[16,32],[16,32]], delay:[15,15,30] },
    "walk": { active:false, pos:[ [0,32], [16,32], [32,32], [48,32] ], sz:[[16,32],[16,32],[16,32],[16,32]], delay:[3,3,3,3] },
  };

  this.anim_order = [ "idle", "walk" ];

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
  for (var ele in this.ele_map) {
    this.color_map[this.ele_map[ele]] = new Uint8ClampedArray(
        [ Math.floor(256*Math.random()),
          Math.floor(256*Math.random()),
          Math.floor(256*Math.random()),
          Math.floor(256*Math.random()) ]);
  }

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

  g_painter.startDrawColor_a("rgba(0,0,0,1)");
  g_imgcache.draw_s(this.sprite_name, imgx, imgy, imgw, imgh, wx, wy, ww, wh, ang, alpha);
  g_painter.endDraw();

}
