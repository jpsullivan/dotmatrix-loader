import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, switchMap, timer } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private updateRate$ = new BehaviorSubject<number>(0.1);
  private refreshRate$ = new BehaviorSubject<number>(150);
  private running$ = new BehaviorSubject<boolean>(false);
  private subscription: Subscription | null = null;

  constructor() {}

  start(canvas: ElementRef<HTMLCanvasElement>, config: any) {
    const ctx = canvas.nativeElement.getContext('2d');
    const {
      color = '82, 96, 104',
      accentColor,
      dotSize = 2,
      dotGap = 3,
      opacityOptions,
      opacityMin = 0.1,
      opacityMax = 1,
    } = config;

    if (!ctx) return;

    this.running$.next(true);

    const pixelRatio = window.devicePixelRatio || 1;
    const canvasWidth = canvas.nativeElement.clientWidth * pixelRatio;
    const canvasHeight = canvas.nativeElement.clientHeight * pixelRatio;
    const dotSizeScaled = dotSize * pixelRatio;
    const dotGapScaled = dotGap * pixelRatio;
    const columns = Math.floor(
      (canvasWidth + dotGapScaled) / (dotSizeScaled + dotGapScaled)
    );
    const rows = Math.floor(
      (canvasHeight + dotGapScaled) / (dotSizeScaled + dotGapScaled)
    );

    canvas.nativeElement.width = canvasWidth;
    canvas.nativeElement.height = canvasHeight;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    this.subscription = this.refreshRate$
      .pipe(switchMap((refreshRate) => timer(0, refreshRate)))
      .subscribe(() => {
        const dotsToUpdate = Math.floor(
          columns * rows * this.updateRate$.getValue()
        );
        for (let i = 0; i < dotsToUpdate; i++) {
          const xIndex = Math.floor(Math.random() * columns);
          const yIndex = Math.floor(Math.random() * rows);
          let opacity;

          if (opacityOptions) {
            opacity =
              opacityOptions[Math.floor(Math.random() * opacityOptions.length)];
          } else {
            opacity = Math.random() * (opacityMax - opacityMin) + opacityMin;
          }

          ctx.fillStyle = `rgba(${color}, ${opacity})`;
          if (accentColor && Math.random() < 0.1) {
            ctx.fillStyle = accentColor;
          }

          ctx.clearRect(
            2 * pixelRatio + xIndex * (dotSizeScaled + dotGapScaled),
            2 * pixelRatio + yIndex * (dotSizeScaled + dotGapScaled),
            dotSizeScaled,
            dotSizeScaled
          );
          ctx.fillRect(
            2 * pixelRatio + xIndex * (dotSizeScaled + dotGapScaled),
            2 * pixelRatio + yIndex * (dotSizeScaled + dotGapScaled),
            dotSizeScaled,
            dotSizeScaled
          );
        }
      });
  }

  stop() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.running$.next(false);
    }
  }

  setUpdateRate(rate: number) {
    this.updateRate$.next(rate);
  }

  setRefreshRate(rate: number) {
    this.refreshRate$.next(rate);
  }
}
