/* ============================================================
   SHADER BACKGROUND — "CETAKAN RISO" (WebGL1, tanpa dependensi)
   Neo-brutalism: kertas krem flat, bercak halftone dither Bayer,
   dua cincin tinta hitam yang mengapung pelan, grain cetak.
   Uniform uEnergy digerakkan GSAP mengikuti fase simulasi;
   uMouse memberi parallax halus.
   ============================================================ */
(function () {
  var canvas = document.getElementById('bg-canvas');
  var state = { energy: 0, mx: 0, my: 0, tx: 0, ty: 0, time: 0 };
  window.BG = { state: state, ok: false, setEnergy: function () {} };

  var gl = null;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'high-performance' }); }
  catch (e) { gl = null; }
  if (!gl) { document.body.classList.add('no-gl'); return; }
  window.BG.ok = true;

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uEnergy;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
    'float vnoise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);',
    'return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}',
    'float bayer2(vec2 a){a=floor(a);return fract(a.x/2.0+a.y*a.y*0.75);}',
    '#define bayer4(a) (bayer2(0.5*(a))*0.25+bayer2(a))',
    '#define bayer8(a) (bayer4(0.5*(a))*0.25+bayer2(a))',
    'void main(){',
    'vec2 uv=(gl_FragCoord.xy-0.5*uRes)/uRes.y;',
    'uv+=uMouse*0.03;',
    'float t=uTime*(0.05+uEnergy*0.055);',
    'vec3 paper=vec3(0.957,0.941,0.898);',
    'vec3 sand=vec3(0.918,0.894,0.816);',
    'vec3 ink=vec3(0.086,0.086,0.102);',
    /* bercak halftone (dua medan noise bergerak pelan) */
    'float n1=vnoise(uv*1.6+vec2(t*0.10,-t*0.06));',
    'float n2=vnoise(uv*2.4+vec2(-t*0.08,t*0.05)+7.31);',
    'float f=smoothstep(0.50,0.74,n1*0.62+n2*0.38);',
    'vec3 col=paper;',
    'float b=bayer8(gl_FragCoord.xy);',
    'col=mix(col,sand,step(b,f));',
    /* cincin tinta yang mengapung */
    'vec2 c1=vec2(-0.60+0.035*sin(t*0.32), 0.36+0.028*cos(t*0.26));',
    'vec2 c2=vec2( 0.68+0.030*sin(t*0.24+2.1),-0.40+0.030*cos(t*0.30+0.8));',
    'float r1=1.0-smoothstep(0.0035,0.0080,abs(length(uv-c1)-0.335));',
    'float r2=1.0-smoothstep(0.0030,0.0070,abs(length(uv-c2)-0.235));',
    'float ring=clamp(r1+r2,0.0,1.0);',
    'col=mix(col,ink,ring*(0.085+uEnergy*0.05));',
    /* uEnergy sedikit memperdalam tekstur */
    'col=mix(col,sand*0.985,uEnergy*0.05);',
    /* grain cetak */
    'col+=(hash(gl_FragCoord.xy+vec2(fract(uTime)*7.13,0.0))-0.5)*0.016;',
    'gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { document.body.classList.add('no-gl'); return; }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { document.body.classList.add('no-gl'); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'uRes'),
      uTime = gl.getUniformLocation(prog, 'uTime'),
      uMouse = gl.getUniformLocation(prog, 'uMouse'),
      uEnergy = gl.getUniformLocation(prog, 'uEnergy');

  var W = 0, H = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(2, Math.floor(window.innerWidth * dpr));
    H = Math.max(2, Math.floor(window.innerHeight * dpr));
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', function (e) {
    state.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    state.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  var last = performance.now();
  gsap.ticker.add(function () {
    var now = performance.now();
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (document.hidden) return;
    state.time += dt;
    state.mx += (state.tx - state.mx) * 0.045;
    state.my += (state.ty - state.my) * 0.045;
    gl.uniform2f(uRes, W, H);
    gl.uniform1f(uTime, state.time);
    gl.uniform2f(uMouse, state.mx, state.my);
    gl.uniform1f(uEnergy, state.energy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });

  window.BG.setEnergy = function (v, dur) {
    gsap.to(state, { energy: v, duration: dur || 1.1, ease: 'power2.out', overwrite: 'auto' });
  };
})();
