import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FinoraToastHost } from './shared/components/finora-toast/finora-toast-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FinoraToastHost],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
