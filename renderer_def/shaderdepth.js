shaderDepth = function (gl) {//line 1,Listing 2.14
  var vertexShaderSource = `
    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix; 
    attribute vec3 aPosition;           
    attribute vec2 aTexCoords;
    varying   vec2 vTexCoords;
    uniform   mat4 uHeadlightProjectionMatrix;
    uniform   mat4 uHeadlightViewMatrix;
    varying vec4 vPosHeadLight;
    
    void main(void)                                
    { 
      gl_Position = uHeadlightProjectionMatrix * uHeadlightViewMatrix* vec4(aPosition, 1.0);
    }                                              
  `;

  var fragmentShaderSource = `
    #extension GL_OES_standard_derivatives : enable
		precision highp float;	                         
    uniform sampler2D uSampler;
    uniform sampler2D uDepthSampler;
    uniform sampler2D uHeadlightSampler;
    varying   vec2 vTexCoords;
    varying vec4 vPosHeadLight;				


		float  PlaneApprox(float Depth) {   
	 // Compute partial derivatives of depth.    
	 float dx = dFdx(Depth);   
	 float dy = dFdy(Depth);   
	 // Compute second moment over the pixel extents.   
	 return  Depth*Depth + 0.25*(dx*dx + dy*dy);   
	 } 
	 
		void main(void)									
		{	
 			//gl_FragColor = vec4(gl_FragCoord.z,PlaneApprox(gl_FragCoord.z),0.0,1.0);
    gl_FragColor = vec4(gl_FragCoord.z,gl_FragCoord.z,gl_FragCoord.z,1.0);
		}	                                            
  `;

  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create the shader program
  var aPositionIndex = 0;
  var aNormalIndex = 1;
  var aTexCoordsIndex = 2;
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, aNormalIndex, "aNormal");
  gl.bindAttribLocation(shaderProgram, aTexCoordsIndex, "aTexCoords");
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    var str = "Unable to initialize the shader program.\n\n";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }

  shaderProgram.aPositionIndex = aPositionIndex;
  shaderProgram.aNormalIndex = aNormalIndex;
  shaderProgram.aTexCoordsIndex = aTexCoordsIndex;
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uSamplerLocation = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.uHeadlightSamplerLocation = gl.getUniformLocation(shaderProgram, "uHeadlightSampler");
  shaderProgram.uHeadlightProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uHeadlightProjectionMatrix");
  shaderProgram.uHeadlightViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uHeadlightViewMatrix");
  shaderProgram.uDepthSamplerLocation   = gl.getUniformLocation(shaderProgram, "uDepthSampler");

  return shaderProgram;
};//line 55