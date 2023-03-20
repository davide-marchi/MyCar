



/*
the FollowFromUpCamera always look at the car from a position abova right over the car
*/
FollowFromUpCamera = function(){

  /* the only data it needs is the position of the camera */
  this.frame = glMatrix.mat4.create();
  
  /* update the camera with the current car position */
  this.update = function(car_position){
    this.frame = car_position;
  }

  /* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
  this.matrix = function(){
    let eye = glMatrix.vec3.create();
    let target = glMatrix.vec3.create();
    let up = glMatrix.vec4.create();
    
    glMatrix.vec3.transformMat4(eye, [0  ,50,0], this.frame);
    glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);
    glMatrix.vec4.transformMat4(up, [0.0,0.0,-1,0.0], this.frame);
    
    return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye,target,up.slice(0,3));	
  }
}

/*
the ChaseCamera always look at the car from behind the car, slightly above
*/
ChaseCamera = function(){

  /* the only data it needs is the frame of the camera */
  this.frame = [0,0,0];
  
  /* update the camera with the current car position */
  this.update = function(car_frame){
    this.frame = car_frame.slice();
  }

  /* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
  this.matrix = function(){
    let eye = glMatrix.vec3.create();
    let target = glMatrix.vec3.create();
    glMatrix.vec3.transformMat4(eye, [0  ,2,5,1.0], this.frame);
    glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);
    return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye, target,[0, 1, 0]);	
  }
}


//observer camera
ObserverCamera = function() {
  /* the only data it needs is the position of the camera */
  this.frame = glMatrix.mat4.create();
  this.xMovement = 0;
  this.yMovement = 0;
  this.zMovement = 0;
  this.mouseCoords = [0, 0];

  //origine del frame
  let translationOrigObserverMatrix = glMatrix.mat4.create();
  glMatrix.mat4.fromTranslation(translationOrigObserverMatrix, [-40, -10, -100]);
  glMatrix.mat4.mul(this.frame, translationOrigObserverMatrix, this.frame);
  let rotationOriginObserverMatrix = glMatrix.mat4.create();
  glMatrix.mat4.fromRotation(rotationOriginObserverMatrix, -Math.PI / 4, [0, 1, 0]);
  glMatrix.mat4.mul(this.frame, rotationOriginObserverMatrix, this.frame);

  
  this.update = function(){ 
    let translationMatrix = glMatrix.mat4.create();
    glMatrix.mat4.fromTranslation(translationMatrix, [this.xMovement, this.yMovement, this.zMovement]);
    glMatrix.mat4.mul(this.frame, translationMatrix, this.frame);
    //rotazione con il mouse
    let rotationMatrix = glMatrix.mat4.create();

    glMatrix.mat4.fromRotation(rotationMatrix, -this.mouseCoords[1] * 0.001, [1, 0, 0]); //angolo in radianti * asse, qui usi l'asse x perchè per la regola della mano destra ciò che non cambia è l'asse x
    glMatrix.mat4.mul(this.frame, rotationMatrix, this.frame);
    glMatrix.mat4.fromRotation(rotationMatrix, -this.mouseCoords[0]* 0.001, [0, 1, 0]);
    glMatrix.mat4.mul(this.frame, rotationMatrix, this.frame);
  }

  /* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
  this.matrix = function(){
    return this.frame;
  }
}

/* the main object to be implementd */
var Renderer = new Object();
/* array of cameras that will be used */
Renderer.cameras = [];
// add a FollowFromUpCamera
Renderer.cameras.push(new FollowFromUpCamera());
Renderer.cameras.push(new ChaseCamera());
Renderer.cameras.push(new ObserverCamera());
// set the camera currently in use
Renderer.currentCamera = 0;
speedWheelAngle = 0;
shadowMapSize = 512.0;

Renderer.createObjectBuffers = function (gl, obj) {

  ComputeNormals(obj);
  
  obj.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

	if(typeof obj.texCoords != 'undefined'){
    		obj.texCoordsBuffer = gl.createBuffer();
    		gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordsBuffer);
    		gl.bufferData(gl.ARRAY_BUFFER, obj.texCoords, gl.STATIC_DRAW);
    		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}

   if(typeof obj.tangents != 'undefined'){ 
       obj.tangentsBuffer = gl.createBuffer();
      	gl.bindBuffer(gl.ARRAY_BUFFER, obj.tangentsBuffer);
      	gl.bufferData(gl.ARRAY_BUFFER, obj.tangents, gl.STATIC_DRAW);
      	gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
     
     if(typeof obj.normals != 'undefined'){
		  	obj.normalBuffer = gl.createBuffer();
 		 		gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
 		 		gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);
  			gl.bindBuffer(gl.ARRAY_BUFFER, null);
  			}
    	
  obj.indexBufferTriangles = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // create edges
  var edges = new Uint16Array(obj.numTriangles * 3 * 2);
  for (var i = 0; i < obj.numTriangles; ++i) {
    edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
    edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
  }

  obj.indexBufferEdges = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

Renderer.drawObject = function (gl, obj, fillColor, lineColor, shader) {


  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(shader.aPositionIndex);
  gl.vertexAttribPointer(shader.aPositionIndex,3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
  gl.enableVertexAttribArray(shader.aNormalIndex);
  gl.vertexAttribPointer(shader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);
  

	if(typeof obj.texCoords != 'undefined'){
	  	gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordsBuffer);	
  		gl.enableVertexAttribArray(shader.aTexCoordsIndex);
  		gl.vertexAttribPointer(shader.aTexCoordsIndex, 2, gl.FLOAT, false, 0, 0);
	}

  if( typeof obj.tangentsBuffer != 'undefined'){ 
     gl.bindBuffer(gl.ARRAY_BUFFER, obj.tangentsBuffer);
    	gl.enableVertexAttribArray(shader.aTangentsIndex);
    	gl.vertexAttribPointer(shader.aTangentsIndex, 3, gl.FLOAT, false, 0, 0);
  }
    
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.uniform4fv(shader.uColorLocation, fillColor);
  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

  gl.disable(gl.POLYGON_OFFSET_FILL);
  
  gl.uniform4fv(shader.uColorLocation, lineColor);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(shader.aPositionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  //gl.useProgram(null);
};

Renderer.initializeObjects = function (gl) {
  Game.setScene(scene_0);
  this.car = Game.addCar("mycar");
  lamps = Game.scene.lamps;
  Renderer.triangle = new Triangle();

  this.cube = new Cube(10);
  this.createObjectBuffers(gl,this.cube);
  
  this.cylinder = new Cylinder(10);
  this.createObjectBuffers(gl,this.cylinder );
  
  Renderer.createObjectBuffers(gl, this.triangle);

  Renderer.createObjectBuffers(gl,Game.scene.trackObj);
  Renderer.createObjectBuffers(gl,Game.scene.groundObj);
  for (var i = 0; i < Game.scene.buildings.length; ++i) { 
	  	Renderer.createObjectBuffers(gl,Game.scene.buildingsObjTex[i]);
	  	Renderer.createObjectBuffers(gl,Game.scene.buildingsObjTex[i].roof);
	  	}
	  	
	Renderer.loadTexture(gl,0,"../common/textures/street4.png");
	Renderer.loadTexture(gl,1,"../common/textures/facade3.jpg");
	Renderer.loadTexture(gl,2,"../common/textures/roof.jpg");
	Renderer.loadTexture(gl,3,"../common/textures/grass_tile.png");
  Renderer.loadTexture(gl,4,"../common/textures/metalBlue.jpg");
  Renderer.loadTexture(gl,5,"../common/textures/metalOrange.jpg");
  Renderer.loadTexture(gl,6,"../common/textures/blackMarble.jpg");
  Renderer.loadTexture(gl,7,"../common/textures/headlight.png"); // RGBA
  
};

Renderer.loadTexture = function (gl,tu, url){
	var image = new Image();
	image.src = url;
	image.addEventListener('load',function(){	
		gl.activeTexture(gl.TEXTURE0+tu);
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D,texture);
    if(tu == 7) {
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    }
    else {
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
		  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
    }
		
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
		});
    
	}

function createFramebuffer(gl,size){
    gl.activeTexture(gl.TEXTURE0+8);
		var depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
		const depthTextureSize = size;
		gl.texImage2D(
	    gl.TEXTURE_2D,      // target
		0,                  // mip level
		gl.DEPTH_COMPONENT, // internal format
		depthTextureSize,   // width
		depthTextureSize,   // height
		0,                  // border
		gl.DEPTH_COMPONENT, // format
		gl.UNSIGNED_INT,    // type
		null);              // data
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 
		var depthFramebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,       // target
			gl.DEPTH_ATTACHMENT,  // attachment point
			gl.TEXTURE_2D,        // texture target
			depthTexture,         // texture
			0);                   // mip level
    	gl.bindTexture(gl.TEXTURE_2D, null);
    	// create a color texture of the same size as the depth texture
		var colorTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, colorTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			depthTextureSize,
			depthTextureSize,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			null,
	);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 
	// attach it to the framebuffer
	gl.framebufferTexture2D(
 	   gl.FRAMEBUFFER,        // target
 	   gl.COLOR_ATTACHMENT0,  // attachment point
 	   gl.TEXTURE_2D,         // texture target
 	   colorTexture,         // texture
 	   0);                    // mip level

  
    	gl.bindTexture(gl.TEXTURE_2D,null);
    	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    	depthFramebuffer.depthTexture = depthTexture;
    	depthFramebuffer.colorTexture = colorTexture;
    	depthFramebuffer.size = depthTextureSize;
    	
    	return depthFramebuffer;
	}


/*
draw the car
*/
Renderer.drawCar = function (gl) {

    M                 = glMatrix.mat4.create();
    rotate_transform  = glMatrix.mat4.create();
    translate_matrix  = glMatrix.mat4.create();
    scale_matrix      = glMatrix.mat4.create();

    // Car starts as a 2.0 x 2.0 x 2.0 cube centered in 0.0 , 0.0 , 0.0
    glMatrix.mat4.fromScaling(scale_matrix,[0.7,0.2,1.0]);          // Dim:    1.4 x 0.4 x 2.0
    glMatrix.mat4.fromTranslation(translate_matrix,[0.0,0.4,0.0]);  // Center: 0.0 , 0.4 , 0.0
    glMatrix.mat4.mul(M,translate_matrix,scale_matrix);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);
    //this.drawObject(gl,this.cube,[0.09,0.56,0.56,1.0],[0.09,0.56,0.56,1.0]);
  this.drawObject(gl,this.cube,[1,1,1,1.0],[1,1,1,1.0],this.uniformShader);
    Renderer.stack.pop();

    Mw                 = glMatrix.mat4.create();
  
    /* draw the wheels */
    // Wheels start as cylinders height = 2.0. radius is assumed to be 1.0 centered in 0,1,0
    glMatrix.mat4.fromRotation(rotate_transform,3.14/2.0,[0,0,1]);
    glMatrix.mat4.fromTranslation(translate_matrix,[1,0,0]);
    glMatrix.mat4.mul(Mw,translate_matrix,rotate_transform);
    
    glMatrix.mat4.fromScaling(scale_matrix,[0.1,0.2,0.2]);
    glMatrix.mat4.mul(Mw,scale_matrix,Mw);
    // Diameter is 2*0.2 = 0.4, height is 2*0.1 = 0.2 and the wheel is centered in 0,0,0

    // Matrice per la rotazione delle ruote all'aumentare della velocità
    speedWheelAngle += Renderer.car.speed;
    if(speedWheelAngle > 3.14 * 2) {          // Controllo se ho eseguito una rotazione completa
      speedWheelAngle -= 3.14 * 2;
    } else if (speedWheelAngle < - (3.14 * 2)) {
      speedWheelAngle += 3.14 * 2;
    } 
    speedBasedRotationMatrix = glMatrix.mat4.create();
    glMatrix.mat4.fromRotation(speedBasedRotationMatrix, speedWheelAngle, [-1, 0, 0]);
    glMatrix.mat4.mul(Mw, speedBasedRotationMatrix, Mw);

  
    glMatrix.mat4.identity(M);

    // Create a rotation matrix that rotates the wheels along the y axis of Renderer.car.wheelsAngle radians
    frontWheelRotationMatrix = glMatrix.mat4.create();
    glMatrix.mat4.fromRotation(frontWheelRotationMatrix, Renderer.car.wheelsAngle * 2, [0, 1, 0]); // Duplicato per rendere più visibile l'effetto
  
    // Draw wheel 1

    glMatrix.mat4.mul(M,frontWheelRotationMatrix,Mw);  // Aggiungo la rotazione per curvare

    glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.2,-0.7]);
    glMatrix.mat4.mul(M,translate_matrix,M);  // M = translate * ROTATE * ROTATE * scale * translate * rotate

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);
    this.drawObject(gl,this.cylinder,[0.1,0.1,0.1,1.0],[0.1,0.1,0.1,1.0],this.uniformShader);
    Renderer.stack.pop();

    // Draw wheel 2

    glMatrix.mat4.mul(M,frontWheelRotationMatrix,Mw);  // Aggiungo la rotazione per curvare
  
    glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.2,-0.7]);
    glMatrix.mat4.mul(M,translate_matrix,M);  // M = translate * ROTATE * ROTATE * scale * translate * rotate

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    this.drawObject(gl,this.cylinder,[0.1,0.1,0.1,1.0],[0.1,0.1,0.1,1.0],this.uniformShader);
    Renderer.stack.pop();

    /* this will increase the size of the wheel to 0.4*1,5=0.6 */
    glMatrix.mat4.fromScaling(scale_matrix,[1,1.5,1.5]);;
    glMatrix.mat4.mul(Mw,scale_matrix,Mw);

    // Draw wheel 3
    glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.3,0.7]);
    glMatrix.mat4.mul(M,translate_matrix,Mw);  // M = translate * ROTATE * scale * scale * translate * rotate
  
    Renderer.stack.push();
    Renderer.stack.multiply(M); 
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    Renderer.stack.pop();
    this.drawObject(gl,this.cylinder,[0.1,0.1,0.1,1.0],[0.1,0.1,0.1,1.0],this.uniformShader);

    // Draw wheel 4
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.3,0.7]);
    glMatrix.mat4.mul(M,translate_matrix,Mw);  // M = translate * ROTATE * scale * scale * translate * rotate
  
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    this.drawObject(gl,this.cylinder,[0.1,0.1,0.1,1.0],[0.1,0.1,0.1,1.0],this.uniformShader);
    Renderer.stack.pop();

  
    // Alettone primo supporto
    glMatrix.mat4.fromScaling(scale_matrix,[0.05,0.1,0.1]);         // Dim:    0.1 x 0.2 x 0.2
    glMatrix.mat4.fromTranslation(translate_matrix,[0.3,0.7,0.8]);  // Center: 0.3 , 0.7 , 0.8
    glMatrix.mat4.mul(M,translate_matrix,scale_matrix);
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    this.drawObject(gl,this.cube,[0.94,0.56,0.28,1.0],[0.94,0.56,0.28,1.0],this.uniformShader);
    Renderer.stack.pop();
  
    // Alettone secondo supporto
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.3,0.7,0.8]); // Center: -0.3 , 0.7 , 0.8
    glMatrix.mat4.mul(M,translate_matrix,scale_matrix);
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    this.drawObject(gl,this.cube,[0.94,0.56,0.28,1.0],[0.94,0.56,0.28,1.0],this.uniformShader);
    Renderer.stack.pop();

    // Alettone pezzo superiore
    glMatrix.mat4.fromScaling(scale_matrix,[0.6,0.05,0.2]);       // Dim:   1.2 x 0.1 x 0.4
    glMatrix.mat4.fromTranslation(translate_matrix,[0,0.85,0.8]); // Center: 0.0 , 0.85 , 0.8
    glMatrix.mat4.mul(M,translate_matrix,scale_matrix);
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    this.drawObject(gl,this.cube,[0.85,0.38,0,1.0],[0.85,0.38,0,1.0],this.uniformShader);
    Renderer.stack.pop();

    // Tettuccio
    glMatrix.mat4.fromScaling(scale_matrix,[0.4,0.1,0.4]);     // Dim:    0.8 x 0.2 x 0.8
    glMatrix.mat4.fromTranslation(translate_matrix,[0,0.7,0]); // Center: 0.3 , 0.7 , 0.8
    glMatrix.mat4.mul(M,translate_matrix,scale_matrix);
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    this.drawObject(gl,this.cube,[0.1,0.1,0.1,1.0],[0.1,0.1,0.1,1.0],this.uniformShader);
    Renderer.stack.pop();
};

function Light(geometry, color) {//line 7, Listing6.8{
  if (!geometry) this.geometry = [0.0, -1.0, 0.0, 0.0];
  else this.geometry = geometry;
  if (!color) this.color = [1.0, 1.0, 1.0, 1.0];
  else this.color = color;
}//line 12}

function Lamp(position, light) {
  this.position = position;
  this.light = light;
}

Renderer.drawScene = function (gl, shader, real) {

  // gl.enable(gl.CULL_FACE)
  this.stack = new MatrixStack();
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(shader);
  
  gl.uniformMatrix4fv(shader.uProjectionMatrixLocation,     false,glMatrix.mat4.perspective(glMatrix.mat4.create(),3.14 / 4, (gl.canvas.width/gl.canvas.height), 1, 500));

  Renderer.cameras[Renderer.currentCamera].update(this.car.frame);

  var invV = Renderer.cameras[Renderer.currentCamera].matrix();


  if (real == 1) {
  //PHONG
  inverseViewMatrix = glMatrix.mat4.create(); //view matrix
  glMatrix.mat4.invert(inverseViewMatrix, invV); //calcolo l'inversa della view matrix
  viewSpaceLightDirection = glMatrix.vec4.create(); //direzione della luce in view space, che si ottiene moltiplicando l'inversa del view matrix con il vettore 
  tmpDirection = Game.scene.weather.sunLightDirection; //serve un vettore a 4 componenti
  tmpDirection[3] = 0; //metto la 4a componente a 0 (vettore)
  glMatrix.vec4.transformMat4(viewSpaceLightDirection, tmpDirection, invV); //moltiplica la matrice per il vettore
  glMatrix.vec4.normalize(viewSpaceLightDirection, viewSpaceLightDirection);
  gl.uniform3fv(shader.uVSLightDirectionLocation, viewSpaceLightDirection.subarray(0,3)); //inserisce il valore nello shader
     

  //passo i lampioni allo shader
  var spotlights = []; //line 304
  //prima creo una matrice per inserire i vettori da passare allo shader e li trasformo in VS
  for (var i = 0; i < Game.scene.lamps.length; i++) {
    var vsSpotlight = glMatrix.vec3.transformMat4(
      glMatrix.vec3.create(),
      [
        Game.scene.lamps[i].position[0],
        Game.scene.lamps[i].height,
        Game.scene.lamps[i].position[2]
      ],
      invV
    );
    spotlights[i * 3 + 0] = vsSpotlight[0];
    spotlights[i * 3 + 1] = vsSpotlight[1];
    spotlights[i * 3 + 2] = vsSpotlight[2];
  }
  gl.uniform3fv(shader.uSpotlightsLocation, spotlights); //passo allo shader

  gl.uniformMatrix4fv(shader.uViewMatrixLocation, false, invV); //passo allo shader la View Matrix
    
  } // fine dell'if real


  
  // initialize the stack with the identity
  this.stack.loadIdentity();
  // multiply by the view matrix
  this.stack.multiply(invV);

 
  if (real == 1) {
    // Passo l'intero per bloccare le texture (1 = le blocco)
    gl.uniform1i(shader.uNoTextureLocation, 1);
  }

  
  // drawing the car
  this.stack.push();
  this.stack.multiply(this.car.frame); // projection * viewport
  //gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
  if(real == 1) {
    this.drawCar(gl);
  }
  this.stack.pop();

  gl.uniformMatrix4fv(shader.uModelViewMatrixLocation, false, this.stack.matrix);

 
  if (real == 1) {
    // Passo l'intero per sbloccare le texture (0 = non le blocco)
    gl.uniform1i(shader.uNoTextureLocation, 0);
  }
 
  
  // Faro / fanale della macchina  
  var eye = glMatrix.vec3.create();
  var target = glMatrix.vec3.create();
  glMatrix.vec3.transformMat4(eye, [0, 0.5, -1], this.car.frame);
  glMatrix.vec3.transformMat4(target, [0, 0.1, -6], this.car.frame);  
  var HeadlightViewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye, target,[0, 1, 0]);	
  gl.uniform1i(shader.uHeadlightSamplerLocation, 7);
  gl.uniformMatrix4fv(shader.uHeadlightViewMatrixLocation, false, HeadlightViewMatrix);
  gl.uniformMatrix4fv(shader.uHeadlightProjectionMatrixLocation, false, glMatrix.mat4.perspective(glMatrix.mat4.create(),Math.PI / 10, 1, 0.1, 100));

  
  // drawing the static elements (ground, track and buldings)
	gl.uniform1i(shader.uSamplerLocation,3);
	this.drawObject(gl, Game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0],shader);
	
	gl.uniform1i(shader.uSamplerLocation,0);
 	this.drawObject(gl, Game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0],shader);
 	
 	
	gl.uniform1i(shader.uSamplerLocation,1);
	for (var i in Game.scene.buildingsObj) 
		this.drawObject(gl, Game.scene.buildingsObjTex[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0],shader);
	gl.uniform1i(shader.uSamplerLocation,2);
  for (var i in Game.scene.buildingsObj) 
		this.drawObject(gl, Game.scene.buildingsObjTex[i].roof, [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0],shader);


  if (real == 1) {
  // Lampioni
  var lamps = Game.scene.lamps;
  this.streetLamps = [];
    for (var i = 0; i < 12; ++i) {// take only the first 6 lights for memory constraints
        var g = lamps[i].position;
        var lightPos = [lamps[i].position[0], lamps[i].position[1], lamps[i].position[2], 1.0];
        lightPos[1] = lightPos[1] + lamps[i].height[i];
        this.streetLamps[i] = new Lamp(g, new Light(lightPos, [0.3, 0.3, 0.2, 1]));  // Colore della luce
    }
  for (var t in this.streetLamps) {
    var stack_lamp = this.stack;
        stack_lamp.push();
     M_8 = glMatrix.mat4.create();
        glMatrix.mat4.fromTranslation(M_8, this.streetLamps[t].position);
        stack_lamp.multiply(M_8);
        stack_lamp.push();
    var M =  glMatrix.mat4.create();
    glMatrix.mat4.fromTranslation(M, [0, 4, 0]);
    stack_lamp.multiply(M);

    var M1 = glMatrix.mat4.create();
    glMatrix.mat4.fromScaling(M1, [0.2, 0.1, 0.2]);
    stack_lamp.multiply(M1);

    gl.uniformMatrix4fv(shader.uModelViewMatrixLocation, false, stack_lamp.matrix);
    //gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);
    this.drawObject(gl, this.cube, [0.811, 0.082, 0.898, 1.0],[0, 0, 0, 1.0],shader);
    stack_lamp.pop();

    stack_lamp.push();
    var M_1_sca = glMatrix.mat4.create();
    glMatrix.mat4.fromScaling(M_1_sca,[0.05, 2, 0.05]);
    stack_lamp.multiply(M_1_sca);

    gl.uniformMatrix4fv(shader.uModelViewMatrixLocation, false, stack_lamp.matrix);
    //gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, this.projectionMatrix);
    this.drawObject(gl, this.cylinder, [0.6, 0.23, 0.12, 1.0],[0, 0, 0, 1.0],shader);
    stack_lamp.pop();
        stack_lamp.pop();
    }
  } // fine if real


	gl.useProgram(null);
};


Renderer.setupAndStart = function () {
  
  
 /* create the canvas */
	Renderer.canvas = document.getElementById("OUTPUT-CANVAS");
  
 /* get the webgl context */
	Renderer.gl = Renderer.canvas.getContext("webgl");

  /* read the webgl version and log */
	var gl_version = Renderer.gl.getParameter(Renderer.gl.VERSION); 
	log("glversion: " + gl_version);
	var GLSL_version = Renderer.gl.getParameter(Renderer.gl.SHADING_LANGUAGE_VERSION)
	log("glsl  version: "+GLSL_version);
  Renderer.gl.getExtension('OES_standard_derivatives');
  var ext = Renderer.gl.getExtension('WEBGL_depth_texture');
	  		if (!ext) {
   		 	return alert('need WEBGL_depth_texture');
  			}
  /* create the matrix stack */
	Renderer.stack = new MatrixStack();

  

  /* initialize objects to be rendered */
  Renderer.initializeObjects(Renderer.gl);
   
  /* create the shader */
  Renderer.uniformShader = new uniformShader(Renderer.gl);
  Renderer.shaderDepth = new shaderDepth(Renderer.gl);

  //gl.useProgram(Renderer.uniformShader);

  /*
  add listeners for the mouse / keyboard events
  */
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);
  Renderer.canvas.addEventListener('keydown',on_keydown,false);
  Renderer.canvas.addEventListener('keyup',on_keyup,false);
  Renderer.canvas.addEventListener('mouseup',on_mouseup,false);
  Renderer.canvas.addEventListener('mousedown',on_mousedown,false);
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);


  Renderer.Display();
}

Renderer.Display = function () {
  framebuffer = createFramebuffer(Renderer.gl,shadowMapSize);
	Renderer.gl.bindFramebuffer(Renderer.gl.FRAMEBUFFER,framebuffer);	
	Renderer.gl.viewport(0, 0, shadowMapSize, shadowMapSize);
	Renderer.gl.clearColor(1.0,1.0,0.0,1.0);
	Renderer.gl.clearDepth(1.0);
  Renderer.gl.clear(Renderer.gl.COLOR_BUFFER_BIT|Renderer.gl.DEPTH_BUFFER_BIT);
  Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, framebuffer.depthTexture);
	Renderer.drawScene(Renderer.gl,Renderer.shaderDepth, 0);
  Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, null);
  Renderer.gl.bindFramebuffer(Renderer.gl.FRAMEBUFFER, null);
  
  
  Renderer.gl.activeTexture(Renderer.gl.TEXTURE8);
  Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, framebuffer.depthTexture);
  Renderer.gl.viewport(0, 0, Renderer.gl.canvas.width, Renderer.gl.canvas.height);
  Renderer.gl.clearColor(0.34, 0.5, 0.74, 1.0);
  Renderer.gl.clearDepth(1.0);
  Renderer.gl.clear(Renderer.gl.COLOR_BUFFER_BIT | Renderer.gl.DEPTH_BUFFER_BIT);
  //active texture texture_n+1 bind framebuffer.depthTexture e poi passo n+1 allo shader
  Renderer.gl.useProgram(Renderer.uniformShader);
  Renderer.gl.uniform1i(this.uniformShader.uDepthSamplerLocation,8);
  Renderer.gl.useProgram(null);
  Renderer.drawScene(Renderer.gl, Renderer.uniformShader, 1);
  Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, null);
  window.requestAnimationFrame(Renderer.Display) ;
};

movingMouse = false;
absoluteMouseCoords = [0,0]; //coordinate assolute quando inizi a cliccare il mouse

on_mouseup = function(e) {
  movingMouse = false;
  Renderer.cameras[Renderer.currentCamera].mouseCoords = [0,0]; //per evitare che si muova all'infinito
}
on_mousedown = function(e) {
  movingMouse = true;
  absoluteMouseCoords = [e.offsetX, e.offsetY];
}
on_mouseMove = function(e){
  if(movingMouse){
    let newCoords = [e.offsetX, e.offsetY];
    Renderer.cameras[Renderer.currentCamera].mouseCoords = [ //differenza tra le coordinate assolute che erano state segnate a dove hai mosso il mouse
      newCoords[0] - absoluteMouseCoords[0],
      newCoords[1] - absoluteMouseCoords[1]
    ];
    absoluteMouseCoords = newCoords;
  }
}
on_keyup = function(e){
	if(Renderer.currentCamera == 2) { //se la modalità di vista è l'observer view
    switch(e.key) {
      case 'D':
      case 'd':
      case 'A':
      case 'a': {
        Renderer.cameras[Renderer.currentCamera].xMovement = 0;
        break;
      }
      case 'w':
      case 'W':
      case 'S':
      case 's': {
        Renderer.cameras[Renderer.currentCamera].zMovement = 0;
        break;
      }
      case 'q':
      case 'Q':
      case 'Z':
      case 'z': {
        Renderer.cameras[Renderer.currentCamera].yMovement = 0;
        break;
      }
    }
  } else { //chase camera/followfromup
	  Renderer.car.control_keys[e.key] = false;
  }
}
on_keydown = function(e){
	if(Renderer.currentCamera == 2) { //se la modalità di vista è l'observer view
    switch(e.key) {
      case 'D':
      case 'd': {
        Renderer.cameras[Renderer.currentCamera].xMovement = -1;
        break;
      }
      case 'A':
      case 'a': {
        Renderer.cameras[Renderer.currentCamera].xMovement = +1;
        break;
      }
      case 'W':
      case 'w': {
        Renderer.cameras[Renderer.currentCamera].zMovement = +1;
        break;
      }
      case 'S':
      case 's': {
        Renderer.cameras[Renderer.currentCamera].zMovement = -1;
        break;
      }
      case 'Q':
      case 'q': {
        Renderer.cameras[Renderer.currentCamera].yMovement = -1;
        break;
      }
      case 'Z':
      case 'z': {
        Renderer.cameras[Renderer.currentCamera].yMovement = +1;
        break;
      }
    }
  } else { //chase camera/followfromup
	  Renderer.car.control_keys[e.key] = true;
  }
}
update_camera = function (value){
  Renderer.currentCamera = value;
}
window.onload = Renderer.setupAndStart;