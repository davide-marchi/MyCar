uniformShader = function (gl) {//line 1,Listing 2.14
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
       vPosHeadLight =  uHeadlightProjectionMatrix * uHeadlightViewMatrix  * vec4(aPosition, 1.0);
      

      gl_Position = uProjectionMatrix *            
      uModelViewMatrix * vec4(aPosition, 1.0); 
      vTexCoords = aTexCoords; 
    }                                              
  `;

  var fragmentShaderSource = `
    precision highp float;                         
    uniform vec4 uColor;   
    uniform sampler2D uSampler;
    uniform sampler2D uHeadlightSampler;
    varying   vec2 vTexCoords;
    varying vec4 vPosHeadLight;
    void main(void)                                
    { 
      vec2 vHeadlightTexCoords = (vPosHeadLight/vPosHeadLight.w).xy;
      vHeadlightTexCoords = vHeadlightTexCoords*.5 +.5;
      if(vHeadlightTexCoords.x>=0.0 && vHeadlightTexCoords.x<=1.0 && vHeadlightTexCoords.y>=0.0 && vHeadlightTexCoords.y<=1.0 && vPosHeadLight.z >= 0.0) {
        vec4 tex_headlight = texture2D(uHeadlightSampler,vHeadlightTexCoords);
        vec3 tex_standard = texture2D(uSampler,vTexCoords).xyz;
        vec3 result = mix(tex_standard, tex_headlight.rgb, tex_headlight.a);
        gl_FragColor = vec4(result, 1.0);
      }
      else {
        gl_FragColor = texture2D(uSampler,vTexCoords);
      }
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
  //var aNormalIndex = 1;
  var aTexCoordsIndex =2;
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
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
  shaderProgram.aTexCoordsIndex = aTexCoordsIndex;
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
  shaderProgram.uSamplerLocation = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.uHeadlightSamplerLocation = gl.getUniformLocation(shaderProgram, "uHeadlightSampler");
  shaderProgram.uHeadlightProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uHeadlightProjectionMatrix");
  shaderProgram.uHeadlightViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uHeadlightViewMatrix");

  return shaderProgram;
};//line 55