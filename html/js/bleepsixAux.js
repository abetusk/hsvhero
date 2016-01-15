/*

    Copyright (C) 2013 Abram Connelly

    This file is part of bleepsix v2.

    bleepsix is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    bleepsix is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with bleepsix.  If not, see <http://www.gnu.org/licenses/>.

    Parts based on bleepsix v1. BSD license
    by Rama Hoetzlein and Abram Connelly.

*/



/*
 * from the accepted (as of 2013-12-21) answer from user John Millikin
 * http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/105074#105074
 *
 */


function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
};

function guid() {
    return s4() + s4() + '-' + 
           s4() + '-' + 
           s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
}

function simplecopy( src )
{
  try {
    return JSON.parse( JSON.stringify(src) );
  } catch(err)
  {
    console.log(err);
    console.trace();
  }
}

function imageCache()
{
  this.image = {};
}

imageCache.prototype.add = function(name, path)
{
  var obj = {};

  obj.path = path;
  obj.ready = 0;

  obj.image = new Image();
  obj.image.onload = function() { 
    obj.ready = 1; 
  };
  obj.image.src = path;


  this.image[name] = obj;
}

imageCache.prototype.addImgData = function(name, img_data)
{
  var obj = {};
  obj.ready = 1;
  obj.image = new Image();
  obj.image.src = img_data;
  this.image[name] = obj;
}

imageCache.prototype.remove = function(name)
{
  if (name in this.image)
  {
    delete this.image[name];
  }
}

imageCache.prototype.draw = function(name, x, y, w, h, a)
{
  if (!(name in this.image))
  {
    console.log("WARNING: " + name + " not in imageCache ");
    return;
  }

  if ( !this.image[name].ready )
  {
    //console.log("WARNING: " + name + " not ready");
    return;
  }

  var img = this.image[name].image;
  g_painter.drawImage( img, x, y, w, h, a );

}

imageCache.prototype.draw_s = function(name, sx, sy, sw, sh, x, y, w, h, ang_rad, a)
{
  if (!(name in this.image))
  {
    console.log("WARNING: " + name + " not in imageCache ");
    return;
  }

  if ( !this.image[name].ready )
  {
    console.log("WARNING: " + name + " not ready");
    return;
  }

  var img = this.image[name].image;

  sx = Math.floor(sx);
  sy = Math.floor(sy);
  sw = Math.floor(sw);
  sh = Math.floor(sh);

  iw = Math.floor(img.width);
  ih = Math.floor(img.height);

  if ((sx<0) || (sy<0) || ((sx+sw)>iw) || ((sy+sh)>ih)) {
    s = sx + "," +  sy + "," +  (sx+sw) + "," +  (sy+sh) + "," +  img.width + "," +  img.height;
    console.log("ERROR!!! " +  name + " " + s);
    return;
  }

  g_painter.drawSubImage(img, sx, sy, sw, sh, x, y, w, h, ang_rad, a);

}

if (typeof module !== 'undefined')
{
  module.exports = {
    s4 : s4,
    guid : guid,
    simplecopy : simplecopy
  };
}

// thank you to user [user37968] on stackoverflow.com
// (answered from Nov 15 2008 at 21:07):
// http://stackoverflow.com/questions/99353/how-to-test-if-a-line-segment-intersects-an-axis-aligned-rectange-in-2d
//
function box_line_intersect(bbox, l0, l1, box_fudge) {
  box_fudge = ( (typeof box_fudge === 'undefined') ? 0 : box_fudge );

  var A = l1.y - l0.y;
  var B = l0.x - l1.x;

  var C = (l1.x*l0.y) - (l0.x*l1.y);

  var f = function(a, b) { return (A*a + B*b + C) > 0; };

  var xm = bbox[0][0] - box_fudge;
  var ym = bbox[0][1] - box_fudge;
  var xM = bbox[1][0] + box_fudge;
  var yM = bbox[1][1] + box_fudge;

  // handle degenerate line (point)
  //
  if ( (l0.x == l1.x) && (l0.y == l1.y) )
  {
    if ( (xm <= l0.x) && (l0.x <= xM) &&
         (ym <= l0.y) && (l0.y <= yM) )
      return true;
  }


  var s0 = f( xm, ym );
  var s1 = f( xM, yM );
  var s2 = f( xM, ym );
  var s3 = f( xm, yM );

  if ( (s0 == s1) && (s1 == s2) && (s2 == s3) )
  {
    return false;
  }

  if ( ((l0.x < xm) && (l1.x < xm)) ||
       ((l0.x > xM) && (l1.x > xM)) ||
       ((l0.y < ym) && (l1.y < ym)) ||
       ((l0.y > yM) && (l1.y > yM)) )
  {
    return false;
  }

  return true;
}


function box_box_intersect(bb0, bb1, box_fudge)
{
  box_fudge = ( (typeof box_fudge === 'undefined') ? 0 : box_fudge );

  /*
  return !( ( bb1[0][0] >  (bb0[1][0] + box_fudge)) ||
            ( bb1[1][0] <  (bb0[0][0] - box_fudge)) ||
            (-bb1[1][1] > -(bb0[0][1] - box_fudge)) ||
            (-bb1[0][1] < -(bb0[1][1] + box_fudge)) );
            */

  return !( ( bb1[0][0] >  (bb0[1][0] + box_fudge)) ||
            ( bb1[1][0] <  (bb0[0][0] - box_fudge)) ||
            ( bb1[1][1] <  (bb0[0][1] - box_fudge)) ||
            ( bb1[0][1] >  (bb0[1][1] + box_fudge)) );

}


// Converted from (a slightly buggy) python version
// from user Alex Martelli posted on Math 13 2010 5:31.
// http://stackoverflow.com/questions/2824478/shortest-distance-between-two-line-segments

//   distance between two segments in the plane:
//   one segment is (x11, y11) to (x12, y12)
//   the other is   (x21, y21) to (x22, y22)
//
function segments_distance(x11, y11, x12, y12, x21, y21, x22, y22)
{

  if (segments_intersect(x11, y11, x12, y12, x21, y21, x22, y22))
    return 0;

  // try each of the 4 vertices w/the other segment
  var distances = [];
  distances.push(point_segment_distance(x11, y11, x21, y21, x22, y22));
  distances.push(point_segment_distance(x12, y12, x21, y21, x22, y22));
  distances.push(point_segment_distance(x21, y21, x11, y11, x12, y12));
  distances.push(point_segment_distance(x22, y22, x11, y11, x12, y12));

  return Math.min.apply(null, distances);

}

// whether two segments in the plane intersect:
// one segment is (x11, y11) to (x12, y12)
// the other is   (x21, y21) to (x22, y22)
//
function segments_intersect(x11, y11, x12, y12, x21, y21, x22, y22)
{
  var local_eps = 0.00001;
  var dx1 = x12 - x11;
  var dy1 = y12 - y11;
  var dx2 = x22 - x21;
  var dy2 = y22 - y21;
  var delta = dx2 * dy1 - dy2 * dx1;

  if (Math.abs(delta) < local_eps)
    return false;

  var s = (dx1 * (y21 - y11) + dy1 * (x11 - x21)) / delta;
  var t = (dx2 * (y11 - y21) + dy2 * (x21 - x11)) / (-delta);

  return (0 <= s) && (s  <= 1) && (0 <= t) && (t  <= 1);

}

function point_segment_distance(px, py, x1, y1, x2, y2)
{
  var local_eps = 0.00001;
  var dx = x2 - x1;
  var dy = y2 - y1;
  if ( (Math.abs(dx - dy) < local_eps) &&
       (Math.abs(dy) < local_eps) )
    return Math.sqrt(((px-x1)*(px-x1) + (py-y1)*(py-y1)));

  var t = ((px - x1) * dx + (py - y1) * dy) / (dx*dx + dy*dy);

  if (t < 0)
  {
    dx = px - x1;
    dy = py - y1;
  }
  else if (t > 1)
  {
    dx = px - x2;
    dy = py - y2;
  }
  else
  {
    var near_x = x1 + t * dx;
    var near_y = y1 + t * dy;
    dx = px - near_x;
    dy = py - near_y;
  }

  return Math.sqrt(dx*dx + dy*dy);

}


var profile_cur = new Date();
var profile_prv = new Date();
var profile_cur_ms = profile_cur.getTime();
var profile_prv_ms = profile_prv.getTime();


function profile_start()
{
  profile_prv = new Date();
  profile_prv_ms = profile_prv.getTime();

  profile_cur = new Date();
  profile_cur_ms = profile_cur.getTime();
}

function profile_cp()
{
  profile_cur    = new Date();
  profile_cur_ms = profile_cur.getTime();
  profile_prv    = profile_cur;
  profile_prv_ms = profile_cur_ms;
}

function profile_cp_print( msg )
{
  if (typeof msg == "undefined") { msg = ""; }

  profile_cur    = new Date();
  profile_cur_ms = profile_cur.getTime();

  console.log( msg, profile_cur_ms - profile_prv_ms );

  profile_prv    = profile_cur;
  profile_prv_ms = profile_cur_ms;
}
