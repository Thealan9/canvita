import { Component, AfterViewInit } from '@angular/core';
import { Directory, Filesystem,Encoding } from '@capacitor/filesystem';
import { ActionSheetController, NavController, Platform, ToastController } from '@ionic/angular';
import { Canvas, Textbox, Image as FabricImage, Point } from 'fabric';
import { Subscription } from 'rxjs';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.page.html',
  styleUrls: ['./editor.page.scss'],
  standalone: false,
})
export class EditorPage implements AfterViewInit {
  canvas!: Canvas;
  currentFile: FileSystemFileHandle | null = null;
  selectedObjectType: string | null = null;
  currentFontSize: number = 24;
  currentFontFamily: string = 'Arial';
  currentFillColor: string = '#000000';
  lockButtonText: string = 'Bloquear';
  private backButtonSub!: Subscription;

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private platform: Platform,
    private navCtrl: NavController,
    private toastCtrl: ToastController,) {}

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
    const activeObject = this.canvas.getActiveObject();

    if (activeObject) {
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
      this.selectedObjectType = null;
      } else {
        this.navCtrl.back();
      }
    });
  }

  ionViewWillLeave() {
    this.backButtonSub.unsubscribe();
  }

  ngAfterViewInit() {
    const tipo = localStorage.getItem('tipeBlank');

    let width = 500;
    let height = 700;

    if (tipo === 'horizontal') {
      width = 1100;
      height = 850;
    }

    this.canvas = new Canvas('canvas', {
      width: width,
      height: height,
      backgroundColor: '#ffffff',
    });
    if (localStorage.getItem('action') === 'open_file') {
      localStorage.removeItem('action');
      this.open();
    } else {
      const temp = localStorage.getItem('template');
      if (temp) {
        const template = JSON.parse(temp);
        fetch(template.json)
          .then((r) => r.text())
          .then((json) => {
            this.canvas.loadFromJSON(json, () => {
              this.canvas.requestRenderAll();
            });
          });
      }
    }

    setTimeout(() => {
  this.fitCanvasToScreen();
}, 500);

    this.canvas.on('selection:created', (e) => this.updateUI(e));
    this.canvas.on('selection:updated', (e) => this.updateUI(e));
    this.canvas.on('selection:cleared', () => {
      this.selectedObjectType = null;
    });
    this.canvas.on('selection:cleared', () => {
  this.selectedObjectType = null;
});
  }
  get currentOrientation() {
  return localStorage.getItem('tipeBlank') || 'vertical';
}
fitCanvasToScreen() {
  const container = document.querySelector('.canvas-area');
  if (!container || !this.canvas) return;

  const currentZoom = this.canvas.getZoom();
  const baseWidth = this.canvas.getWidth() / currentZoom;
  const baseHeight = this.canvas.getHeight() / currentZoom;


  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;


  const scale = Math.min(
    (containerWidth * 0.85) / baseWidth,
    (containerHeight * 0.85) / baseHeight
  );


  this.canvas.setZoom(1);

  this.canvas.setDimensions({
    width: baseWidth * scale,
    height: baseHeight * scale
  });

  this.canvas.setZoom(scale);
  this.canvas.renderAll();
}
  addText() {
    const text = new Textbox('Escribe aquí', {
      left: 50,
      top: 50,
      fontSize: 24,
      fill: '#000',
    });
    this.canvas.add(text);
    this.canvas.setActiveObject(text);
  }

  async addImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = async (f: any) => {
        const img = await FabricImage.fromURL(f.target.result);

        img.scale(0.5);
        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        this.canvas.renderAll();
      };

      reader.readAsDataURL(file);
    };

    input.click();
  }

  delete() {
    const obj = this.canvas.getActiveObject();
    if (obj) this.canvas.remove(obj);
  }

  changeColor(event: any) {
    const obj: any = this.canvas.getActiveObject();
    if (obj && obj.set) {
      obj.set('fill', event.target.value);
      this.canvas.requestRenderAll();
    }
  }

  changeFontSize(event: any) {
    const obj: any = this.canvas.getActiveObject();
    if (obj && obj.type === 'textbox') {
      const newVal = parseInt(event.detail.value);
      obj.set('fontSize', newVal);
      this.currentFontSize = newVal;
      this.canvas.requestRenderAll();
    }
  }

  changeBackground(event: any) {
    this.canvas.backgroundColor = event.target.value;
    this.canvas.requestRenderAll();
  }

  //web
//  async save() {
//   if (!this.currentFile) {
//     return this.saveAs();
//   }

//   const currentZoom = this.canvas.getZoom();

//   this.canvas.setZoom(1);

//   const realWidth = this.canvas.getWidth() / currentZoom;
//   const realHeight = this.canvas.getHeight() / currentZoom;

//   const json = this.canvas.toJSON();
//   json.width = realWidth;
//   json.height = realHeight;

//   const stringJson = JSON.stringify(json);

//   this.canvas.setZoom(currentZoom);
//   this.canvas.requestRenderAll();

//   const writable = await this.currentFile.createWritable();
//   await writable.write(stringJson);
//   await writable.close();

//   console.log('Guardado con éxito con dimensiones:', realWidth, 'x', realHeight);
// }

// movil
async save() {
  const currentZoom = this.canvas.getZoom();
  this.canvas.setZoom(1);

  const realWidth = this.canvas.getWidth() / currentZoom;
  const realHeight = this.canvas.getHeight() / currentZoom;

  const json = this.canvas.toJSON();
  json.width = realWidth;
  json.height = realHeight;

  const stringJson = JSON.stringify(json);

  this.canvas.setZoom(currentZoom);
  this.canvas.requestRenderAll();

  if (!this.currentFile) {
    const nuevoNombre = `proyecto_${Date.now()}.json`;
    this.currentFile = { name: nuevoNombre } as any;
  }

  const fileName = (this.currentFile as any).name;

  if (this.platform.is('hybrid')) {
    try {
      const result = await Filesystem.writeFile({
        path: fileName,
        data: stringJson,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      await Share.share({
        title: 'Guardar Proyecto',
        text: 'Archivo de proyecto Dezain',
        url: result.uri,
        dialogTitle: '¿Dónde quieres guardar tu proyecto?',
      });

      this.presentToast(`Listo para guardar como: ${fileName}`);
      return;
    } catch (err) {
      console.error(err);
      this.presentToast("Error al intentar guardar");
      return;
    }
  }

  if (this.currentFile && (this.currentFile as any).createWritable) {
    try {
      const writable = await (this.currentFile as any).createWritable();
      await writable.write(stringJson);
      await writable.close();
      this.presentToast("Sobrescrito con éxito");
      return;
    } catch (err) {
      console.warn(err);
    }
  }

  const blob = new Blob([stringJson], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
  this.presentToast("Descargado exitosamente");
}
//web
//   async open() {
//   try {
//     const [fileHandle] = await (window as any).showOpenFilePicker({
//       types: [{
//         description: 'Proyecto',
//         accept: { 'application/json': ['.json'] },
//       }],
//     });

//     this.currentFile = fileHandle;
//     const file = await fileHandle.getFile();
//     const text = await file.text();
//     const projectData = JSON.parse(text);


//     if (projectData.width && projectData.height) {

//       this.canvas.setZoom(1);

//       this.canvas.setDimensions({
//         width: projectData.width,
//         height: projectData.height,
//       });

//       const orientacion = projectData.width > projectData.height ? 'horizontal' : 'vertical';
//       localStorage.setItem('tipeBlank', orientacion);
//     }

//     this.canvas.loadFromJSON(projectData).then(() => {
//       this.canvas.requestRenderAll();

//       setTimeout(() => {
//         this.fitCanvasToScreen();
//       }, 300);
//     });

//   } catch (err) {
//     console.error('Error al abrir:', err);
//   }
// }

async open() {

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;
    this.currentFile = { name: file.name } as any;
    const reader = new FileReader();

    reader.onload = (f: any) => {
      try {
        const projectData = JSON.parse(f.target.result);


        if (projectData.width && projectData.height) {

          this.canvas.setZoom(1);

          this.canvas.setDimensions({
            width: projectData.width,
            height: projectData.height,
          });


          const orientacion = projectData.width > projectData.height ? 'horizontal' : 'vertical';
          localStorage.setItem('tipeBlank', orientacion);
        }


        this.canvas.loadFromJSON(projectData).then(() => {
          this.canvas.requestRenderAll();


          setTimeout(() => {
            this.fitCanvasToScreen();
          }, 300);
        });

      } catch (err) {
        console.error('Error al procesar el archivo JSON:', err);
        alert('El archivo seleccionado no es un proyecto válido.');
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

//web
 exportAs(format: 'png' | 'jpeg' | 'webp') {
   const currentZoom = this.canvas.getZoom();
   const currentWidth = this.canvas.getWidth();
   const currentHeight = this.canvas.getHeight();

   this.canvas.setZoom(1);

   const realWidth = currentWidth / currentZoom;
   const realHeight = currentHeight / currentZoom;

   this.canvas.setDimensions({
     width: realWidth,
      height: realHeight
   });

   const objects = this.canvas.getObjects();
   const lockedObjects: any[] = [];
   objects.forEach((obj) => {
     if (obj.lockMovementX) {
       lockedObjects.push({ item: obj, originalOpacity: obj.opacity });
       obj.set('opacity', 1);
     }
   });

   this.canvas.renderAll();


   const data = this.canvas.toDataURL({
     format: format,
     quality: 1,
     multiplier: 3,
   });


   lockedObjects.forEach((data) => {
     data.item.set('opacity', data.originalOpacity);
   });

   this.canvas.setZoom(currentZoom);
   this.canvas.setDimensions({
     width: currentWidth,
     height: currentHeight
   });

   this.canvas.renderAll();

   const link = document.createElement('a');
   link.href = data;
   link.download = `diseño.${format}`;
   link.click();
 }

//movil
// async exportAs(format: 'png' | 'jpeg' | 'webp') {

//   const currentZoom = this.canvas.getZoom();
//   const currentWidth = this.canvas.getWidth();
//   const currentHeight = this.canvas.getHeight();
//   this.canvas.setZoom(1);
//   const realWidth = currentWidth / currentZoom;
//   const realHeight = currentHeight / currentZoom;
//   this.canvas.setDimensions({ width: realWidth, height: realHeight });

//   this.canvas.renderAll();

//   const dataUrl = this.canvas.toDataURL({
//     format: format,
//     quality: 1,
//     multiplier: 3,
//   });

//   this.canvas.setZoom(currentZoom);
//   this.canvas.setDimensions({ width: currentWidth, height: currentHeight });
//   this.canvas.renderAll();

//   const fileName = `diseno_${Date.now()}.${format}`;

//   try {

//     const savedFile = await Filesystem.writeFile({
//       path: fileName,
//       data: dataUrl,
//       directory: Directory.Cache
//     });


//     await Share.share({
//       title: 'Exportar Diseño',
//       text: 'Aquí tienes tu diseño',
//       url: savedFile.uri,
//       dialogTitle: 'Compartir o Guardar imagen',
//     });

//   } catch (error) {
//     const link = document.createElement('a');
//     link.href = dataUrl;
//     link.download = fileName;
//     link.click();
//   }
// }

  async presentExportMenu() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Exportar diseño',
      buttons: [
        { text: 'PNG', handler: () => this.exportAs('png') },
        { text: 'JPG', handler: () => this.exportAs('jpeg') },
        { text: 'WebP', handler: () => this.exportAs('webp') },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await actionSheet.present();
  }

  toggleLock() {
    const obj: any = this.canvas.getActiveObject();
    if (!obj) return;

    const isLocked = obj.lockMovementX;
    const newState = !isLocked;

    obj.set({
      lockMovementX: newState,
      lockMovementY: newState,
      lockScalingX: newState,
      lockScalingY: newState,
      lockRotation: newState,
      editable: !newState,
      hasControls: !newState,
    });

    obj.opacity = newState ? 0.7 : 1;

    this.lockButtonText = newState ? 'Desbloquear' : 'Bloquear';

    this.canvas.requestRenderAll();
  }

  async duplicate() {
    const obj = this.canvas.getActiveObject();
    if (!obj) return;

    const cloned = await obj.clone();

    cloned.set({
      left: obj.left! + 20,
      top: obj.top! + 20,
    });

    this.canvas.add(cloned);
    this.canvas.setActiveObject(cloned);
    this.canvas.requestRenderAll();
  }

  changeFont(event: any) {
    const obj: any = this.canvas.getActiveObject();
    if (!obj || obj.type !== 'textbox') return;

    obj.set('fontFamily', event.detail.value);
    this.canvas.requestRenderAll();
  }

  updateUI(e: any) {
    const selectedObject = e.selected[0];
    this.selectedObjectType = selectedObject.type;
    this.lockButtonText = selectedObject.lockMovementX
      ? 'Desbloquear'
      : 'Bloquear';

    if (selectedObject.type === 'textbox') {

      this.currentFontSize = selectedObject.fontSize;
      this.currentFontFamily = selectedObject.fontFamily;
      this.currentFillColor = selectedObject.fill as string;
    }
  }

  bringToFront() {
  const obj = this.canvas.getActiveObject();
  if (obj) {
    this.canvas.bringObjectToFront(obj);
    this.canvas.requestRenderAll();
  }
}

sendToBack() {
  const obj = this.canvas.getActiveObject();
  if (obj) {
    this.canvas.sendObjectToBack(obj);
    this.canvas.requestRenderAll();
  }
}

bringForward() {
  const obj = this.canvas.getActiveObject();
  if (obj) {
    this.canvas.bringObjectForward(obj);
    this.canvas.requestRenderAll();
  }
}

sendBackwards() {
  const obj = this.canvas.getActiveObject();
  if (obj) {
    this.canvas.sendObjectBackwards(obj);
    this.canvas.requestRenderAll();
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
