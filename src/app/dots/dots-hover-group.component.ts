import { Component } from '@angular/core';

@Component({
  selector: 'app-dots-hover-group',
  standalone: true,
  template: `
    <div class="h-full relative -mr-[3px] flex flex-auto flex-wrap pl-px pt-px">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .dots-hover-group {
        position: relative;
      }
    `,
  ],
})
export class DotsHoverGroupComponent {
  private currentZIndex = 0;

  incrementZIndex(): number {
    return ++this.currentZIndex;
  }
}
