import { animate, style, transition, trigger } from '@angular/animations';
import { NgIf } from '@angular/common';
import { Component, HostBinding, HostListener, Input } from '@angular/core';
import { DotsHoverGroupComponent } from './dots-hover-group.component';
import { DotsComponent } from './dots.component';

@Component({
  selector: 'app-dots-hover-block',
  standalone: true,
  imports: [DotsComponent, NgIf],
  template: `
    <a
      [href]="href"
      class="group h-full relative -ml-px -mt-px flex w-full flex-none items-center justify-center border bg-gray-950 py-8 transition-[border-color,z-index] delay-150 hover:delay-0 hover:duration-300 focus:!z-[--focus-z] focus:transition-none border-gray-800"
      [class.hovered]="isHovered"
      (mouseenter)="onHover()"
      (focus)="onHover()"
      (mouseleave)="onUnhover()"
      (blur)="onUnhover()"
      [style.zIndex]="zIndex"
    >
      <div *ngIf="isHovered" [@fadeInOut] class="absolute inset-0.5">
        <app-dots
          [colors]="colors"
          [opacities]="[0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]"
          [totalSize]="3"
          [dotSize]="1"
          [center]="['x']"
          [shader]="
            'float intro_offset = distance(u_resolution / 2.0 / u_total_size, st2) * 0.01 + (random(st2) * 0.15); opacity *= step(intro_offset, u_time); opacity *= clamp((1.0 - step(intro_offset + 0.1, u_time)) * 1.25, 1.0, 1.25);'
          "
        >
        </app-dots>
      </div>
      <ng-content></ng-content>
    </a>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
      }
      .hover-block {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        border: 1px solid #1f2937;
        background-color: #030712;
        transition: border-color 150ms;
        margin-left: -1px;
        margin-top: -1px;
      }
      .dots-container {
        position: absolute;
        inset: 2px;
      }
    `,
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('300ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class DotsHoverBlockComponent {
  @Input() href!: string;
  @Input() colors!: number[][];

  isHovered = false;

  constructor(private group: DotsHoverGroupComponent) {}

  @HostListener('mouseenter')
  @HostListener('focus')
  onHover() {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      this.isHovered = true;
      this.updateZIndex();
    }
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  onUnhover() {
    this.isHovered = false;
  }

  private updateZIndex() {
    const newZIndex = this.group.incrementZIndex();
    this.zIndex = newZIndex;
  }

  @HostBinding('style.zIndex')
  zIndex = 0;
}
