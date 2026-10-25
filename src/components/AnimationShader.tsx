import { useEffect, useRef } from 'react'

// Animation de cercles lumineux concentriques, d'après le composant « Shader Animation »
// de 21st.dev (designali-in). Réécrite en WebGL simple, sans la bibliothèque Three.js,
// pour garder l'app légère sur le téléphone.

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const FRAGMENT = `
precision highp float;
uniform vec2 resolution;
uniform float time;
void main(void) {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
  float t = time * 0.05;
  float lineWidth = 0.002;
  vec3 color = vec3(0.0);
  for (int j = 0; j < 3; j++) {
    for (int i = 0; i < 5; i++) {
      color[j] += lineWidth * float(i * i) / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
    }
  }
  gl_FragColor = vec4(color[0], color[1], color[2], 1.0);
}
`

function compiler(gl: WebGLRenderingContext, type: number, source: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, source)
  gl.compileShader(s)
  return s
}

export default function AnimationShader({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false })
    if (!gl) return // navigateur sans WebGL : le fond sombre du conteneur reste visible

    const prog = gl.createProgram()!
    gl.attachShader(prog, compiler(gl, gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(prog, compiler(gl, gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    // Deux triangles qui couvrent tout le cadre.
    const tampon = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, tampon)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    const uResolution = gl.getUniformLocation(prog, 'resolution')
    const uTime = gl.getUniformLocation(prog, 'time')

    // Rendu à résolution limitée : aussi joli, beaucoup moins gourmand en batterie.
    const redimensionner = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * ratio))
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * ratio))
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uResolution, canvas.width, canvas.height)
    }
    const observateur = new ResizeObserver(redimensionner)
    observateur.observe(canvas)
    redimensionner()

    // Les personnes qui ont demandé moins d'animations à leur appareil voient une image fixe.
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let temps = 1
    let image = 0
    const dessiner = () => {
      temps += 0.05
      gl.uniform1f(uTime, temps)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      if (!reduit) image = requestAnimationFrame(dessiner)
    }
    dessiner()

    return () => {
      cancelAnimationFrame(image)
      observateur.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return <canvas ref={canvasRef} className={`animation-shader ${className}`} aria-hidden="true" />
}
