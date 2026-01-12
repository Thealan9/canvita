import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage {
  email: string = '';
  pass: string = '';
  confirmPass: string = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async onRegister() {
    if (this.pass !== this.confirmPass) {
      this.presentToast('Las contraseñas no coinciden');
      return;
    }

    if (this.pass.length < 8) {
      this.presentToast('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Creando cuenta...' });
    await loading.present();

    try {
      const res = await createUserWithEmailAndPassword(this.auth, this.email, this.pass);

      localStorage.setItem('user_session', res.user.uid);

      await loading.dismiss();
      this.router.navigate(['/index']);

    } catch (error: any) {
      await loading.dismiss();
      let mensaje = 'Error al registrarse';
      if (error.code === 'auth/email-already-in-use') mensaje = 'El correo ya está registrado';

      this.presentToast(mensaje);
    }
  }

  async presentToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'warning',
      position: 'bottom'
    });
    toast.present();
  }
}
