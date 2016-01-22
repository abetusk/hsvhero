var g_world;
var lastUpdateTime = new Date();
var updateThreshold = 15;
var frame=0;
var g_show_fps = false;
var lastTime = new Date();

var g_painter = null;
var g_imgcache = null;

function loop() {
  var d = new Date();
  var update = false;
  var dt = d.getTime() - lastUpdateTime.getTime();

  if (dt > updateThreshold) {
    lastUpdateTime = d;
    update = true;
  }

  //frame = frame + 1;
  frame++;
  if ( frame >= 30 ) {
    msec = (d.getTime() - lastTime ) / frame;
    lastTime = d;
    frame = 0;
  }

  if (g_show_fps) {
    console.log("fps:", 1000.0/msec);
  }

  requestAnimationFrame(loop, 1);

  if (update) {
    g_world.update();
  }

  g_painter.dirty_flag = true;
  if (g_painter.dirty_flag) {
    g_world.draw();
  }

}


if ( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = ( function() {
      return window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function( callback, element ) {
        window.setTimeout( callback, 1000 );
      };
    } )();
}

$(document).ready( function() {
  console.log("ready...");

  g_world = new mainWorld();
  g_painter = new bleepsixRender("canvas");

  init();
  requestAnimationFrame(loop, 1);
});

function delayed_init() {
  if (g_imgcache.image["base_sprite"].ready) {
    g_world.fill();
  } else {
    setTimeout(delayed_init, 100);
  }
}

function _clamp(val, l, u) {
  val = ((val<l) ? l : val);
  val = ((val>u) ? u : val);
  return val;
}

var g_color_history = [];

function save_history(cm) {
  var cm_cpy = {};

  for (var key in cm) {
    var a = [];
    for (var ii=0; ii<cm[key].length; ii++) {
      a.push(cm[key][ii]);
    }
    cm_cpy[key] =  new Uint8ClampedArray(a);
  }
  g_color_history.push(cm_cpy);
}

function load_from_history(hist_ind) {
  g_world.color_map = g_color_history[hist_ind];
  fill_map();
  g_world.fill();
}

function fill_map() {
  for (var ele in g_world.ele_map) {
    var src_color = g_world.ele_map[ele];
    var dst_color = g_world.color_map[src_color];

    ele_parts = ele.split("_");
    var c = tinycolor({r:dst_color[0], g:dst_color[1], b:dst_color[2]});

    $("#" + ele_parts[0] + "-color-" + ele_parts[1]).spectrum("set", c.toHexString());
  }
}


function init() {

  setTimeout(delayed_init, 100);

  // Download functionality
  //
  var button = document.getElementById("btn-download");
  button.addEventListener("click", function(e) {
    var dataURL = g_world.canvas.toDataURL("image/png");
    button.href = dataURL;
  });

  // Upload funcitonality
  //
  /*
  function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
  }
  */
  function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

      // Only process image files.
      if (!f.type.match('image.*')) {
        console.log("skipping", f);
        continue;
      }

      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {

          console.log(">>>", e.target.result);

          // Render thumbnail.
          //var span = document.createElement('span');
          //span.innerHTML = ['<img class="thumb" src="', e.target.result,
          //                  '" title="', escape(theFile.name), '"/>'].join('');
          //document.getElementById('list').insertBefore(span, null);
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }
  }

  document.getElementById('file-upload').addEventListener('change', handleFileSelect, false);

  //--

  g_imgcache = new imageCache();
  g_imgcache.add("base_sprite", "assets/hsvhero_0.png");

  $('#x1').on('click', function() { console.log("x1"); g_world.scale = 1; });
  $('#x2').on('click', function() { console.log("x2"); g_world.scale = 2; });
  $('#x4').on('click', function() { console.log("x4"); g_world.scale = 4; });
  $('#x8').on('click', function() { console.log("x8"); g_world.scale = 8; });
  $('#x16').on('click', function() { console.log("x16"); g_world.scale = 16; });

  var g_playpause = "pause";

  $('#play-pause').on('click',
    function() {
      var z = document.getElementById("play-pause");

      if (g_playpause=="play") {
        z.innerHTML = '<span class="glyphicon glyphicon-stop" aria-hidden="true"></span>';
        g_playpause="pause"
      } else {
        z.innerHTML = '<span class="glyphicon glyphicon-play" aria-hidden="true"></span>';
        g_playpause="play";
      }
      console.log("play-pause");
    }
  );

  /*
  $("#delay-input").on("change", function() {
    var s_val = document.getElementById("delay-input").value;
    var val = 100;
    if (val = parseInt(s_val)) {
      if (isNaN(val)) { val=100; }
      if (val <= 0) { val = 100; }
    } else { val = 100; }
    g_world.setDelay(val);
  });
  */

  $("#fps-slider-input").slider({
    value:10,
    min:1,
    max:60,
    step:1,
    slide: function(event, ui) {
      console.log(">>>", ui.value);
      $("#fps-display").val( ui.value + " fps" );
      g_world.setDelay(1000/ui.value);
    }
  });
  $("#fps-display").val( "10 fps" );
  g_world.setDelay(1000/10);


  $('#all-checkbox').on('click', function() { console.log("all-checkbox...", document.getElementById("all-checkbox").checked); });

  $('#idle-checkbox').on('click', function() { g_world.animLoop("idle", document.getElementById("idle-checkbox").checked); });
  $('#walk-checkbox').on('click', function() { g_world.animLoop("walk", document.getElementById("walk-checkbox").checked); });
  $('#jump-checkbox').on('click', function() { g_world.animLoop("jump", document.getElementById("jump-checkbox").checked); });
  $('#attack-checkbox').on('click', function() { g_world.animLoop("attack", document.getElementById("attack-checkbox").checked); });
  $('#attack-crouch-checkbox').on('click', function() { g_world.animLoop("attack-crouch", document.getElementById("attack-crouch-checkbox").checked); });
  $('#attack-jump-checkbox').on('click', function() { g_world.animLoop("attack-jump", document.getElementById("attack-jump-checkbox").checked); });
  $('#shield-checkbox').on('click', function() { g_world.animLoop("shield", document.getElementById("shield-checkbox").checked); });
  $('#shield-crouch-checkbox').on('click', function() { g_world.animLoop("shield-crouch", document.getElementById("shield-crouch-checkbox").checked); });
  $('#bow-checkbox').on('click', function() { g_world.animLoop("bow", document.getElementById("bow-checkbox").checked); });

  document.getElementById("walk-checkbox").checked = true;
  g_world.animLoop("walk", true);

  var parts = [ "tunic", "boot", "pant", "arm", "skin", "hair", "weapon" ];
  var npart = [       3,      3,      2,     3,      3,      1,        6 ];

  for (var i=0; i<parts.length; i++) {
    for (var j=0; j<npart[i]; j++) {

      var ele_name = "#" + parts[i] + "-color-" + j;
      var it_name = parts[i] + "_" + j;

      var rgba = g_world.color_map[ g_world.ele_map[it_name] ];

      var r = rgba[0];
      var g = rgba[1];
      var b = rgba[2];

      var hex_rgb = rgbToHex(r,g,b);

      $(ele_name).spectrum({
        showInput:true,
        allowEmpty:true,
        //color:"#f00",
        color: hex_rgb,
        change: (function(__ele_name,__it_name) { return function(c) {
          color_change(__ele_name, c);

          var rgb = c.toRgb();

          var src_color = g_world.ele_map[__it_name];
          g_world.color_map[src_color] =
             new Uint8ClampedArray([ Math.floor(rgb.r),
                                     Math.floor(rgb.g),
                                     Math.floor(rgb.b), 255 ]);

          g_world.update_class_color(__it_name);

          g_world.fill();
          };
        })(ele_name, it_name)
      });


    }
  }


  $("#background-color").spectrum({
    preferredFormat:"hsv",
    showInput:true,
    allowEmpty:true,
    color:"hsva(0,0%,0%,0)",
    showAlpha:true,
    //change: function(c) { console.log("background", ">>>", c.toHexString(), c.getAlpha()); }


      change: (function(__ele_name,__it_name) { return function(c) {
        color_change(__ele_name, c);

        var rgb = c.toRgb();

        var src_color = g_world.ele_map[__it_name];
        g_world.color_map[src_color] =
           new Uint8ClampedArray([ Math.floor(rgb.r),
                                   Math.floor(rgb.g),
                                   Math.floor(rgb.b), 255 ]);
        g_world.fill();
        };
      })("background", "background")
  });

  $("#reset_color").on("click", function() {
    g_world.reset_color_map();

    for (var ele in g_world.ele_map) {
      var src_color = g_world.ele_map[ele];
      var dst_color = g_world.color_map[src_color];

      ele_parts = ele.split("_");
      var c = tinycolor({r:dst_color[0], g:dst_color[1], b:dst_color[2]});

      $("#" + ele_parts[0] + "-color-" + ele_parts[1]).spectrum("set", c.toHexString());
    }
    g_world.fill();

  });

  $("#random_hsv_color").on("click", function() {

    var key_color = ["tunic_0", "boot_0", "pant_0", "arm_0", "skin_0", "hair_0"]

    for (var ind in key_color) {
      var ele = key_color[ind];

      var ele_parts = ele.split("_");
      var src_color = g_world.ele_map[ele];

      /*
      var r = Math.floor(Math.random()*255);
      var g = Math.floor(Math.random()*255);
      var b = Math.floor(Math.random()*255);
      var c = tinycolor("rgb(" + r + "," + g + "," + b + ")");
      */

      var h_range = g_world.random_h_range;
      var h_base = g_world.random_h_base;

      var s_range = g_world.random_s_range;
      var s_base = g_world.random_s_base;

      var v_range = g_world.random_v_range;
      var v_base = g_world.random_v_base;

      var h = Math.floor(Math.random()*h_range + h_base);
      h = _clamp(h, 0, 360);

      var s = Math.random()*s_range + s_base;
      s = _clamp(s, 0, 1);

      var v = Math.random()*v_range + v_base;
      v = _clamp(v, 0, 1);

      hsv_str = "hsv(" + h + "," + s + "," + v + ")";
      var c = tinycolor(hsv_str);

      var _rgb = c.toRgb();
      var r = _rgb.r;
      var b = _rgb.b;
      var g = _rgb.g;

      g_world.color_map[src_color] =
         new Uint8ClampedArray([ r, g, b, 255 ]);

      g_world.update_class_color(ele);
      $("#" + ele_parts[0] + "-color-" + ele_parts[1]).spectrum("set", c.toHsvString());
    }

    var key_color = ["weapon_0", "weapon_1", "weapon_2", "weapon_3", "weapon_4", "weapon_5"] 

    for (var ind in key_color) {
      var ele = key_color[ind];

      var ele_parts = ele.split("_");
      var src_color = g_world.ele_map[ele];

      var r = Math.floor(Math.random()*255);
      var g = Math.floor(Math.random()*255);
      var b = Math.floor(Math.random()*255);

      var c = tinycolor("rgb(" + r + "," + g + "," + b + ")");

      g_world.color_map[src_color] =
         new Uint8ClampedArray([ r, g, b, 255 ]);
      $("#" + ele_parts[0] + "-color-" + ele_parts[1]).spectrum("set", c.toHsvString());
    }

    g_world.fill();

    // Finally add it to the history list
    //
    var ind = g_color_history.length;
    save_history(g_world.color_map);
    $("#history-list").append('<a href="#" onclick="load_from_history(' + ind + ')" class="list-group-item">Historic ' + (ind+1) + '</a>');

  });

  $("#random_color").on("click", function() {
    g_world.random_color_map();

    /*
    for (var ele in g_world.ele_map) {
      var src_color = g_world.ele_map[ele];
      var dst_color = g_world.color_map[src_color];

      ele_parts = ele.split("_");
      var c = tinycolor({r:dst_color[0], g:dst_color[1], b:dst_color[2]});

      $("#" + ele_parts[0] + "-color-" + ele_parts[1]).spectrum("set", c.toHexString());
    }
    */
    fill_map();

    g_world.fill();


    // Finally add it to the history list
    //
    var ind = g_color_history.length;
    save_history(g_world.color_map);
    $("#history-list").append('<a href="#" onclick="load_from_history(' + ind + ')" class="list-group-item">Historic ' + (ind+1) + '</a>');

  });

  $("#arm-lock-button").on("click", function() {

    var ele = document.getElementById("arm-lock-button");
    var bfr_state = ele.getAttribute("aria-pressed");

    if (bfr_state == "true") {
      g_world.lock_arm = false;
    } else {
      g_world.lock_arm = true;
    }

  });

  $("#boot-lock-button").on("click", function() {

    var ele = document.getElementById("boot-lock-button");
    var bfr_state = ele.getAttribute("aria-pressed");

    if (bfr_state == "true") {
      g_world.lock_boot = false;
    } else {
      g_world.lock_boot = true;
    }

  });

  /*
  $('#tunic-color-1').spectrum({
    color:"#f00",
    change: function(c) { console.log("tunic-0 >>>", c.toHexString()); }
  });

  $('#tunic-color-2').spectrum({
    color:"#f00",
    change: function(c) { console.log("tunic-0 >>>", c.toHexString()); }
  });
  */

  $("input[name=radio-0]").click(function() {
    console.log(">>>", $(this).val());

    var val = $(this).val();

    if (val=="all") {
      g_world.lock_state = "all";
    }

    else if (val=="none") {
      g_world.lock_state = "none";
    }

  });


}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


function color_change(ele_name, color) {
  //console.log(">>>", ele_name, color.toHexString());
}
