import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

interface ShaderUniform {
  type: 'uniform1f' | 'uniform3f' | 'uniform1fv' | 'uniform3fv';
  value: number | number[] | number[][];
}

interface TextureInfo {
  width: number;
  height: number;
  texture: WebGLTexture;
  location: WebGLUniformLocation | null;
}

// Helper type for WebGL texture units
type TextureUnit =
  | 'TEXTURE0'
  | 'TEXTURE1'
  | 'TEXTURE2'
  | 'TEXTURE3'
  | 'TEXTURE4'
  | 'TEXTURE5'
  | 'TEXTURE6'
  | 'TEXTURE7'
  | 'TEXTURE8'
  | 'TEXTURE9'
  | 'TEXTURE10'
  | 'TEXTURE11'
  | 'TEXTURE12'
  | 'TEXTURE13'
  | 'TEXTURE14'
  | 'TEXTURE15';

@Component({
  selector: 'app-shader',
  standalone: true,
  template: `
    <canvas
      #canvas
      class="absolute inset-0 h-full w-full"
      [attr.aria-hidden]="true"
    >
    </canvas>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class ShaderComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() source!: string;
  @Input() uniforms: Record<string, ShaderUniform> = {};
  @Input() textures: string[] = [];
  @Input() maxFps = Infinity;
  @Input() initialState: 'playing' | 'paused' = 'playing';

  private readonly DEFAULT_VERTEX_SHADER = `#version 300 es
    precision mediump float;
    in vec2 coordinates;
    uniform vec2 u_resolution;
    out vec2 fragCoord;

    void main(void) {
      gl_Position = vec4(coordinates, 0.0, 1.0);
      fragCoord = (coordinates + 1.0) * 0.5 * u_resolution;
      fragCoord.y = u_resolution.y - fragCoord.y;
    }`;

  private gl!: WebGL2RenderingContext;
  private ctx!: CanvasRenderingContext2D;
  private program: WebGLProgram | null = null;
  private animationFrameId?: number;
  private startTime: number | null = null;
  private currentTime = 0;
  private eventTime = 0;
  private lastFrameTime = 0;
  private textureObjects: TextureInfo[] = [];
  private resizeObserver?: ResizeObserver;
  private state: 'playing' | 'paused';

  constructor(private ngZone: NgZone) {
    this.state = this.initialState;
  }

  play(): void {
    this.state = 'playing';
  }

  pause(): void {
    this.state = 'paused';
  }

  fireEvent(): void {
    this.eventTime = this.currentTime;
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      return shader;
    }

    console.error(
      'Shader compilation error:',
      this.gl.getShaderInfoLog(shader)
    );
    this.gl.deleteShader(shader);
    return null;
  }

  private createProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ): WebGLProgram | null {
    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      return program;
    }

    console.error('Program linking error:', this.gl.getProgramInfoLog(program));
    return null;
  }

  private getTextureUnit(index: number): TextureUnit {
    // Ensure index is within valid range (0-15 for most WebGL implementations)
    if (index < 0 || index > 15) {
      throw new Error('Texture unit index out of range');
    }
    return `TEXTURE${index}` as TextureUnit;
  }

  private async loadTexture(url: string, index: number): Promise<TextureInfo> {
    return new Promise((resolve, reject) => {
      const texture = this.gl.createTexture();
      if (!texture) return reject(new Error('Failed to create texture'));

      const textureUnit = this.getTextureUnit(index);
      this.gl.activeTexture(this.gl[textureUnit]);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_S,
        this.gl.CLAMP_TO_EDGE
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_T,
        this.gl.CLAMP_TO_EDGE
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MIN_FILTER,
        this.gl.LINEAR
      );

      const textureInfo: TextureInfo = {
        width: 1,
        height: 1,
        texture,
        location: this.gl.getUniformLocation(
          this.program!,
          `u_texture_${index}`
        ),
      };

      const image = new Image();
      image.addEventListener('load', () => {
        textureInfo.width = image.width;
        textureInfo.height = image.height;

        this.gl.activeTexture(this.gl[textureUnit]);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureInfo.texture);
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          image
        );

        resolve(textureInfo);
      });

      image.src = url;
    });
  }

  private bindTexture(textureInfo: TextureInfo, index: number): void {
    if (textureInfo.location) {
      const textureUnit = this.getTextureUnit(index);

      this.gl.uniform1i(textureInfo.location, index);
      this.gl.activeTexture(this.gl[textureUnit]);
      this.gl.bindTexture(this.gl.TEXTURE_2D, textureInfo.texture);
    }
  }

  private initWebGL(): void {
    const canvas = this.canvasRef.nativeElement;
    const offscreenCanvas = document.createElement('canvas');
    const dpr = Math.max(1, Math.min(window.devicePixelRatio ?? 1, 2));

    canvas.width = offscreenCanvas.width = canvas.offsetWidth * dpr;
    canvas.height = offscreenCanvas.height = canvas.offsetHeight * dpr;

    this.gl = offscreenCanvas.getContext('webgl2')!;
    this.ctx = canvas.getContext('2d')!;

    if (!this.gl || !this.ctx) {
      console.error('WebGL2 not supported');
      return;
    }

    const vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      this.DEFAULT_VERTEX_SHADER
    );
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      this.source
    );

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to compile shaders');
      return;
    }

    this.program = this.createProgram(vertexShader, fragmentShader);
    if (!this.program) {
      console.error('Failed to create shader program');
      return;
    }

    this.gl.useProgram(this.program);

    // Set up vertex buffer
    const vertexBuffer = this.gl.createBuffer();
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    const coordinatesLocation = this.gl.getAttribLocation(
      this.program,
      'coordinates'
    );
    this.gl.enableVertexAttribArray(coordinatesLocation);
    this.gl.vertexAttribPointer(
      coordinatesLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    // Set up uniforms
    const resolutionLocation = this.gl.getUniformLocation(
      this.program,
      'u_resolution'
    );
    this.gl.uniform2f(
      resolutionLocation,
      canvas.width / dpr,
      canvas.height / dpr
    );

    // Set custom uniforms
    for (const [name, uniform] of Object.entries(this.uniforms)) {
      const location = this.gl.getUniformLocation(this.program, name);

      switch (uniform.type) {
        case 'uniform1f':
          this.gl.uniform1f(location, uniform.value as number);
          break;
        case 'uniform3f':
          const [x, y, z] = uniform.value as [number, number, number];
          this.gl.uniform3f(location, x, y, z);
          break;
        case 'uniform1fv':
          this.gl.uniform1fv(location, uniform.value as number[]);
          break;
        case 'uniform3fv':
          this.gl.uniform3fv(location, (uniform.value as number[][]).flat());
          break;
      }
    }

    // Set up blending
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
    this.gl.disable(this.gl.DEPTH_TEST);

    // Clean up shaders
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      canvas.width = offscreenCanvas.width = canvas.offsetWidth * dpr;
      canvas.height = offscreenCanvas.height = canvas.offsetHeight * dpr;
      this.gl?.uniform2f(
        resolutionLocation,
        canvas.width / dpr,
        canvas.height / dpr
      );
    });

    this.resizeObserver.observe(canvas);
  }

  private animate(timestamp: number): void {
    if (!this.gl || !this.ctx || !this.program) return;

    if (this.state === 'paused') {
      this.scheduleNextFrame();
      return;
    }

    const currentTime = timestamp / 1000;

    if (this.startTime === null) {
      this.startTime = currentTime;
    }

    if (this.maxFps !== Infinity) {
      if (timestamp - this.lastFrameTime < 1000 / this.maxFps) {
        this.scheduleNextFrame();
        return;
      }
      this.lastFrameTime = timestamp;
    }

    this.currentTime = currentTime - this.startTime;

    // Update uniforms
    const timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
    const scrollLocation = this.gl.getUniformLocation(this.program, 'u_scroll');
    const eventTimeLocation = this.gl.getUniformLocation(
      this.program,
      'u_event_time'
    );

    this.gl.uniform1f(timeLocation, this.currentTime);
    this.gl.uniform1f(scrollLocation, window.scrollY);
    this.gl.uniform1f(eventTimeLocation, this.eventTime);

    // Clear and prepare for rendering
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Bind textures
    this.textureObjects.forEach((textureObject, index) => {
      this.bindTexture(textureObject, index);
    });

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    // Copy to visible canvas
    this.ctx.clearRect(
      0,
      0,
      this.canvasRef.nativeElement.width,
      this.canvasRef.nativeElement.height
    );
    this.ctx.drawImage(this.gl.canvas, 0, 0);

    this.scheduleNextFrame();
  }

  private scheduleNextFrame(): void {
    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = requestAnimationFrame((timestamp) =>
        this.animate(timestamp)
      );
    });
  }

  async ngOnInit(): Promise<void> {
    this.initWebGL();

    // Load textures
    for (let i = 0; i < this.textures.length; i++) {
      try {
        const textureInfo = await this.loadTexture(this.textures[i], i);
        this.textureObjects.push(textureInfo);
      } catch (err) {
        console.error('Failed to load texture:', err);
        return;
      }
    }

    this.scheduleNextFrame();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.resizeObserver?.disconnect();

    if (this.gl && this.program) {
      // Clean up WebGL resources
      this.textureObjects.forEach(({ texture }) => {
        this.gl.deleteTexture(texture);
      });
      this.gl.deleteProgram(this.program);
    }
  }
}
