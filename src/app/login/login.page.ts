import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {

  email: string = '';
  pass: string = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async onLogin() {
    const loading = await this.loadingCtrl.create({ message: 'Ingresando...' });
    await loading.present();

    try {

      const res = await signInWithEmailAndPassword(this.auth, this.email, this.pass);


      localStorage.setItem('user_session', res.user.uid);

      loading.dismiss();

      this.router.navigate(['/index']);

    } catch (error: any) {
      loading.dismiss();
      this.presentToast('Correo o contraseña incorrectos');
      console.error(error);
    }
  }

  async presentToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'danger',
      position: 'bottom'
    });
    toast.present();
  }
}
