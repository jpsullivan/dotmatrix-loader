import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { LoaderService } from '../loader.service';

@Component({
  selector: 'app-matrixloader',
  standalone: true,
  template: `
    <canvas
      #canvas
      class="h-full w-full transition-opacity duration-500 ease-out opacity-100"
    ></canvas>
  `,
})
export class MatrixloaderComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() config: any = {};
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  constructor(private loaderService: LoaderService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.loaderService.start(this.canvas, this.config);
  }

  ngOnDestroy(): void {
    this.loaderService.stop();
  }
}
