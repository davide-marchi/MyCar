uniformShader = function (gl) {//line 1,Listing 2.14
  var vertexShaderSource = `

    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix;              
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uViewMatrix;

    varying vec3 vVSNormal; //normale in view space
    varying vec3 vVSViewDirection;
    varying vec3 vVSPosition; //posizione punto 
    varying vec3 vVSSpotlightDirection;
        
    attribute vec2 aTexCoords;
    varying   vec2 vTexCoords;
    uniform   mat4 uHeadlightProjectionMatrix;
    uniform   mat4 uHeadlightViewMatrix;
    varying vec4 vPosHeadLight;

    uniform int uNoTexture;

    
    void main(void)                                
    { 
       vPosHeadLight =  uHeadlightProjectionMatrix * uHeadlightViewMatrix  * vec4(aPosition, 1.0);

      gl_Position = uProjectionMatrix *            
      uModelViewMatrix * vec4(aPosition, 1.0); 
      vTexCoords = aTexCoords;

      vVSNormal = normalize(uModelViewMatrix * vec4(aNormal, 0.0)).xyz;
      vVSViewDirection = -normalize(uModelViewMatrix * vec4(aPosition, 1.0)).xyz;
      vVSPosition = (uModelViewMatrix * vec4(aPosition, 1.0)).xyz; //posizione in VS
      
      //calcolo la direzione dei faretti in VS
      //line 28
      vVSSpotlightDirection = normalize(uViewMatrix * vec4(0.0, -1.0, 0.0, 0.0)).xyz;      
    }                                              
  `;

  var fragmentShaderSource = `

    precision highp float;                         
    uniform vec4 uColor;                           
    uniform vec3 uVSLightDirection;
    varying vec3 vVSNormal; //normale in view space
    varying vec3 vVSViewDirection;
    varying vec3 vVSPosition;

    //spotlights
    uniform vec3 uSpotlights[12];
    varying vec3 vVSSpotlightDirection;

    uniform sampler2D uSampler;
    uniform sampler2D uHeadlightSampler;
    varying   vec2 vTexCoords;
    varying vec4 vPosHeadLight;
    uniform sampler2D uDepthSampler;

    uniform int uNoTexture;
  
    varying vec4 vPosition;

 

    void main(void)                                
    { 

        vec4 tmpColor;

        // Faro macchina e texture
        vec2 vHeadlightTexCoords = (vPosHeadLight/vPosHeadLight.w).xy;
        vHeadlightTexCoords = vHeadlightTexCoords*.5 +.5;
        vec3 tC = (vPosHeadLight/vPosHeadLight.w).xyz;
				tC = tC*0.5+0.5;
        float storedDepth =  texture2D(uDepthSampler,tC.xy).x;
        if(vHeadlightTexCoords.x>=0.0 && vHeadlightTexCoords.x<=1.0 && vHeadlightTexCoords.y>=0.0 && vHeadlightTexCoords.y<=1.0 && vPosHeadLight.z >= 0.0 && (tC.x > 0.0 || tC.x < 1.0 ||
  	     		tC.y > 0.0 || tC.y < 1.0) && storedDepth+0.0009 > tC.z) {
        vec4 tex_headlight = texture2D(uHeadlightSampler,vHeadlightTexCoords);
        vec3 tex_standard = texture2D(uSampler,vTexCoords).xyz;
        vec3 result = mix(tex_standard, tex_headlight.rgb, tex_headlight.a);
        tmpColor = vec4(result, 1.0);
      }
    else {
        tmpColor = texture2D(uSampler,vTexCoords);
    }
    // Fine faro macchina e texture

    
    // Per disegnare una macchina senza texture
      if (uNoTexture == 1) {
        tmpColor = uColor;
      }

      float diffuseLight = max(dot(uVSLightDirection, vVSNormal), 0.0)* 0.5 + 0.5;
      vec3 diffuseColor = tmpColor.xyz * diffuseLight * 0.5;
      
      vec3 reflection_dir = -uVSLightDirection + 2.0 * dot(uVSLightDirection, vVSNormal) * vVSNormal;
      float specularLight = max(0.0, pow(dot(vVSViewDirection, reflection_dir), 1.0)); //10 shininess
      vec3 specularColor = tmpColor.xyz * specularLight;

      //spotlights
      float spotlightLight = 0.0;
      for(int i = 0; i < 12; i ++){
        float tmplight = 0.4;
        float cosangle = max(dot(normalize(vVSPosition-uSpotlights[i]), vVSSpotlightDirection), 0.0);
        if(cosangle < 0.69){ //senza if non viene tagliato direttamente
          tmplight = 0.0;
        }
        if(cosangle > 0.95) {
          tmplight = cosangle;
        }
        if(cosangle <= 0.95 && cosangle >= 0.69) {
          tmplight = pow(cosangle, 2.0);
        }
        
        spotlightLight += tmplight;
     }
      vec3 spotlightColor = vec3(0.9, 0.9, 0.6)*spotlightLight;

      gl_FragColor = vec4(diffuseColor + specularColor + spotlightColor, 1.0);
      //gl_FragColor = vec4(diffuseColor + vec3(0, 0, 0) + spotlightColor, 1.0);

      
      //gl_FragColor = tmpColor; // PER DEBUGGING, DA TOGLIERE DOPO
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
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
  shaderProgram.uSamplerLocation = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.uHeadlightSamplerLocation = gl.getUniformLocation(shaderProgram, "uHeadlightSampler");
  shaderProgram.uHeadlightProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uHeadlightProjectionMatrix");
  shaderProgram.uHeadlightViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uHeadlightViewMatrix");
  shaderProgram.uDepthSamplerLocation   = gl.getUniformLocation(shaderProgram, "uDepthSampler");
  shaderProgram.uVSLightDirectionLocation = gl.getUniformLocation(shaderProgram, "uVSLightDirection");
  shaderProgram.uViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uViewMatrix");
  //spotlights
  shaderProgram.uSpotlightsLocation = gl.getUniformLocation(shaderProgram, "uSpotlights");
  // Per disegnare una macchina senza texture
  shaderProgram.uNoTextureLocation = gl.getUniformLocation(shaderProgram, "uNoTexture");

  return shaderProgram;
};//line 55