import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatrixloaderComponent } from './matrixloader/matrixloader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatrixloaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'matrixloader';
}
