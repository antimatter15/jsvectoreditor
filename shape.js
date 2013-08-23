

VectorEditor.prototype.deleteSelection = function(){
  while(this.selected.length > 0){
    this.deleteShape(this.selected[0])
  }
}

VectorEditor.prototype.deleteShape = function(shape,nofire){
  if(!nofire){if(this.fire("delete",shape)===false)return;}

  if(shape && shape.node && shape.node.parentNode){
    shape.remove()
  }
  for(var i = 0; i < this.trackers.length; i++){
    if(this.trackers[i].shape == shape){
      this.removeTracker(this.trackers[i]);
    }
  }
  for(var i = 0; i < this.shapes.length; i++){
    if(this.shapes[i] == shape){
      this.shapes.splice(i, 1)
    }
  }
  for(var i = 0; i < this.selected.length; i++){
    if(this.selected[i] == shape){
      this.selected.splice(i, 1)
    }
  }
  //should remove references, but whatever
}

VectorEditor.prototype.deleteAll = function(){
  this.fire("clear2")
  this.draw.clear()
  this.shapes = []
  this.trackers = []
}

VectorEditor.prototype.clearShapes = function(){
  this.fire("clear")
  while(this.shapes.length > 0){
    this.deleteShape(this.shapes[0],true) //nofire
  }
}

VectorEditor.prototype.generateUUID = function(){
  var uuid = "", d = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(var i = 0; i < 4/*16*/; i++){
    uuid += d.charAt(Math.floor(Math.random()*(i?d.length:(d.length-10))));
  }
  return uuid;
}

VectorEditor.prototype.getShapeById = function(v){
  for(var i=this.shapes.length;i--&&this.shapes[i].id!=v;);
  return this.shapes[i]
}

VectorEditor.prototype.addShape = function(shape,no_select, no_fire){
  if(!no_fire)this.fire("addshape",shape,no_select);
  shape.node.shape_object = shape
  if(!no_select){
    this.selected = [shape]
  }
  this.shapes.push(shape)
  if(!no_fire)this.fire("addedshape",shape,no_select);
}

VectorEditor.prototype.rectsIntersect = function(r1, r2) {
  return r2.x < (r1.x+r1.width) && 
          (r2.x+r2.width) > r1.x &&
          r2.y < (r1.y+r1.height) &&
          (r2.y+r2.height) > r1.y;
}

VectorEditor.prototype.drawGrid = function(){
  this.draw.drawGrid(0, 0, 480, 272, 10, 10, "blue").toBack()
}

VectorEditor.prototype.move = function(shape, dx, dy){
  if(shape.type == "rect" || shape.type == "image" || shape.type == "ellipse"){
    shape.attr("x", shape.attr("x") + dx)
    shape.attr("y", shape.attr("y") + dy)
  }else if(shape.type == "path"){
    shape.attr('path', Raphael.transformPath(shape.attr('path'), ['t', dx, dy]))
  }

  this.renormalizeRotation(shape)

}


VectorEditor.prototype.applyTransforms = function(shape){
  // exclude rotations
  if(shape.type == "path"){
    // console.log(shape)
    var applied = [], kept = [], raw = shape.transform();
    // TODO: make this more elegant
    for(var i = 0; i < raw.length; i++){
      if(raw[i][0] != 'r'){
        applied.push(raw[i]);
      }else{
        kept.push(raw[i])
      }
    }
    var path = Raphael.transformPath(shape.attr('path'), applied);
    // console.log(path)

    // raphael seems to randomly turn straight segments into curves
    // so lets not do that
    for(var i = 0; i < path.length; i++){
      if(path[i][0] == 'C'){
        // console.log(path[i])
        path[i] = ['L', path[i][5], path[i][6]]
      }
    }
    shape.attr('path', path)
    shape.transform(kept)
  }
  
}

// VectorEditor.prototype.scale = function(shape, corner, x, y){
//   var xp = 0, yp = 0
//   var box = shape.getBBox()
//   switch(corner){
//     case "tr":
//       xp = box.x
//       yp = box.y + box.height
//       break;
//     case "bl":
//       xp = box.x + box.width
//       yp = box.y
//       break;
//     case "tl":
//       xp = box.x + box.width;
//       yp = box.y + box.height;
//     break;
//     case "br":
//       xp = box.x
//       yp = box.y
//     break;
//   }
//   shape.scale(x, y, xp, yp)
// }

VectorEditor.prototype.fixText = function(str){
  return window.Ax?Ax.textfix(str):str;
}

// VectorEditor.prototype.resize = function(object, width, height, x, y){

VectorEditor.prototype.except = function(type, tran){
  var bin = [];
  for(var i = 0; i < tran.length; i++){
    if(tran[i][0] != type) bin.push(tran[i]);
  }
  return bin
}

VectorEditor.prototype.renormalizeRotation = function(shape){
  var raw = shape.transform(), kept = [];
  var rotation = 0;
  for(var i = 0; i < raw.length; i++){
    if(raw[i][0] == 'r'){
      rotation += raw[i][1];
      // ignore the center, recompute that based on stuff
    }else{
      kept.push(raw[i])
    }
  }
  shape.transform('')
  shape.transform(kept)
  shape.rotate(rotation)
}


VectorEditor.prototype.rotate = function(shape, deg){
  shape.transform('')
  shape.rotate(deg)
}

VectorEditor.prototype.resize = function(shape, raw_x, raw_y, box){
  
  var x = box[0],
      y = box[1],
      width = raw_x - x,
      height = raw_y - y

  if(shape.type == "rect" || shape.type == "image"){
    if(width > 0){
      shape.attr("width", width)
    }else{
      shape.attr("x", (x?x:shape.attr("x"))+width)
      shape.attr("width", Math.abs(width)) 
    }
    if(height > 0){
      shape.attr("height", height)
    }else{
      shape.attr("y", (y?y:shape.attr("y"))+height)
      shape.attr("height", Math.abs(height)) 
    }
  }else if(shape.type == "ellipse"){
    if(width > 0){
      shape.attr("rx", width)
    }else{
      shape.attr("x", (x?x:shape.attr("x"))+width)
      shape.attr("rx", Math.abs(width)) 
    }
    if(height > 0){
      shape.attr("ry", height)
    }else{
      shape.attr("y", (y?y:shape.attr("y"))+height)
      shape.attr("ry", Math.abs(height)) 
    }
  }else if(shape.type == "text"){
    shape.attr("font-size", Math.abs(width))
    //shape.node.style.fontSize = null;
  }else if(shape.type == "path"){
    var transforms = this.except('s', shape.transform())
    transforms.push(['s', width / box[2], height / box[3], x, y])
    shape.transform(transforms)
    // shape.attr('path', Raphael.transformPath(shape.attr('path'), ['s', width / box[2], height / box[3], x, y]))
  }

  this.renormalizeRotation(shape)
}
