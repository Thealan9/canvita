import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton } from "@ionic/angular/standalone";

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone:false
})
export class InicioPage implements OnInit {

  tripticos: any[] = [];
  invitaciones: any[] = [];
  blank: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    const all = this.getTemplates();
    this.blank = all.filter(t => t.category === 'blank')
    this.tripticos = all.filter(t => t.category === 'triptico');
    this.invitaciones = all.filter(t => t.category === 'invitacion');
  }

  openBlank(t: string) {
    localStorage.removeItem('template');
    localStorage.setItem('tipeBlank', t );
    this.router.navigate(['/editor']);
  }

  openTemplate(t: any) {
    console.log(t)
    localStorage.setItem('tipeBlank', t.orientacion );
    localStorage.setItem('template', JSON.stringify(t));
    this.router.navigate(['/editor']);
  }


async openLocalProject() {
 localStorage.setItem('action', 'open_file');
  this.router.navigate(['/editor']);
}


  getTemplates() {
    return [
      {
        id: 'blank1',
        name: 'Lienzo en blanco vertical',
        category: 'blank',
        preview: 'assets/blank.png',
        orientacion: 'vertical',
        json: null
      },
      {
        id: 'blank2',
        name: 'Lienzo en blanco horizontal',
        category: 'blank',
        preview: 'assets/blank.png',
        orientacion: 'horizontal',
        json: null
      },
      {
        id: 'trip1',
        name: 'Tríptico clásico',
        category: 'triptico',
        preview: 'assets/templates/tripticos/triptico1.png',
        orientacion: 'horizontal',
        json: 'assets/templates/tripticos/triptico1.json'
      },
      {
        id: 'trip2',
        name: 'Tríptico clasico 2',
        category: 'triptico',
        preview: 'assets/templates/tripticos/triptico2.png',
        orientacion: 'horizontal',
        json: 'assets/templates/tripticos/triptico2.json'
      },

      {
        id: 'inv1',
        name: 'Invitación cumpleaños',
        category: 'invitacion',
        preview: 'assets/templates/invitaciones/invitacion1.png',
        orientacion: 'vertical',
        json: 'assets/templates/invitaciones/invitacion1.json'
      },
      {
        id: 'inv2',
        name: 'Invitación quince años',
        category: 'invitacion',
        preview: 'assets/templates/invitaciones/invitacion2.png',
        orientacion: 'vertical',
        json: 'assets/templates/invitaciones/invitacion2.json'
      },
      {
        id: 'inv3',
        name: 'Invitacion graduación',
        category: 'invitacion',
        preview: 'assets/templates/invitaciones/invitacion3.png',
        orientacion: 'vertical',
        json: 'assets/templates/invitaciones/invitacion3.json'
      }
    ];
  }


}
