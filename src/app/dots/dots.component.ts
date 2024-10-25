import { Component, Input } from '@angular/core';
import { ShaderComponent } from './shader.component';

interface ShaderUniforms {
  u_colors: {
    type: 'uniform3fv';
    value: number[][];
  };
  u_opacities: {
    type: 'uniform1fv';
    value: number[];
  };
  u_total_size: {
    type: 'uniform1f';
    value: number;
  };
  u_dot_size: {
    type: 'uniform1f';
    value: number;
  };
}

@Component({
  selector: 'app-dots',
  standalone: true,
  imports: [ShaderComponent],
  template: `
    <app-shader
      [source]="getShaderSource()"
      [uniforms]="uniforms"
      [maxFps]="60"
    >
    </app-shader>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class DotsComponent {
  @Input() colors: number[][] = [[0, 0, 0]];
  @Input() opacities: number[] = [
    0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14,
  ];
  @Input() totalSize = 4;
  @Input() dotSize = 2;
  @Input() center: ('x' | 'y')[] = ['x', 'y'];
  @Input() init = '';
  @Input() shader = '';

  get uniforms(): Record<string, ShaderUniforms[keyof ShaderUniforms]> {
    // Expand colors array to 6 items for the shader
    let expandedColors = [
      this.colors[0],
      this.colors[0],
      this.colors[0],
      this.colors[0],
      this.colors[0],
      this.colors[0],
    ];

    if (this.colors.length === 2) {
      expandedColors = [
        ...Array(3).fill(this.colors[0]),
        ...Array(3).fill(this.colors[1]),
      ];
    } else if (this.colors.length === 3) {
      expandedColors = [
        this.colors[0],
        this.colors[0],
        this.colors[1],
        this.colors[1],
        this.colors[2],
        this.colors[2],
      ];
    }

    return {
      u_colors: {
        type: 'uniform3fv',
        value: expandedColors.map((color) => [
          color[0] / 255,
          color[1] / 255,
          color[2] / 255,
        ]),
      },
      u_opacities: {
        type: 'uniform1fv',
        value: this.opacities,
      },
      u_total_size: {
        type: 'uniform1f',
        value: this.totalSize,
      },
      u_dot_size: {
        type: 'uniform1f',
        value: this.dotSize,
      },
    };
  }

  getShaderSource(): string {
    return `#version 300 es
precision mediump float;

in vec2 fragCoord;

uniform float u_time;
uniform float u_opacities[10];
uniform vec3 u_colors[6];
uniform float u_total_size;
uniform float u_dot_size;
uniform vec2 u_resolution;
${this.init}

out vec4 fragColor;

float PHI = 1.61803398874989484820459;
float random(vec2 xy) {
  return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
  vec2 st = fragCoord.xy;

  ${
    this.center.includes('x')
      ? 'st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));'
      : ''
  }
  ${
    this.center.includes('y')
      ? 'st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));'
      : ''
  }

  float opacity = step(0.0, st.x);
  opacity *= step(0.0, st.y);

  vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

  float frequency = 5.0;
  float show_offset = random(st2);
  float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency) + 1.0);
  opacity *= u_opacities[int(rand * 10.0)];
  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

  vec3 color = u_colors[int(show_offset * 6.0)];

  ${this.shader}

  fragColor = vec4(color, opacity);
  fragColor.rgb *= fragColor.a;
}`;
  }
}
