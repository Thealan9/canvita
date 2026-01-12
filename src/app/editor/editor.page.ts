import { Component, AfterViewInit } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { ActionSheetController } from '@ionic/angular';
import { Canvas, Textbox, Image as FabricImage, Point } from 'fabric';

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

  constructor(private actionSheetCtrl: ActionSheetController) {}

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

    this.canvas.on('selection:created', (e) => this.updateUI(e));
    this.canvas.on('selection:updated', (e) => this.updateUI(e));
    this.canvas.on('selection:cleared', () => {
      this.selectedObjectType = null;
    });
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
      obj.set('fontSize', event.detail.value);
      this.canvas.requestRenderAll();
    }
  }

  changeBackground(event: any) {
    this.canvas.backgroundColor = event.target.value;
    this.canvas.requestRenderAll();
  }

  // async save() {
  //   if (!this.currentFile) {
  //     return this.saveAs();
  //   }

  //   const json = JSON.stringify(this.canvas.toJSON());

  //   const writable = await this.currentFile.createWritable();
  //   await writable.write(json);
  //   await writable.close();

  //   alert('Guardado');
  // }

  async save() {
    if (!this.currentFile) {
      return this.saveAs();
    }

    const json = this.canvas.toJSON();
    json.width = this.canvas.getWidth();
    json.height = this.canvas.getHeight();

    const stringJson = JSON.stringify(json);

    const writable = await this.currentFile.createWritable();
    await writable.write(stringJson);
    await writable.close();
  }

  async saveAs() {
    this.currentFile = await (window as any).showSaveFilePicker({
      suggestedName: 'diseño.json',
      types: [
        {
          description: 'Proyecto',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });

    await this.save();
  }

  // async open() {
  //   const [fileHandle] = await (window as any).showOpenFilePicker({
  //     types: [
  //       {
  //         description: 'Proyecto',
  //         accept: { 'application/json': ['.json'] },
  //       },
  //     ],
  //   });

  //   this.currentFile = fileHandle;

  //   const file = await fileHandle.getFile();
  //   const text = await file.text();

  //   this.canvas.loadFromJSON(text, () => {
  //     this.canvas.requestRenderAll();
  //   });
  // }
  async open() {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Proyecto',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });

      this.currentFile = fileHandle;
      const file = await fileHandle.getFile();
      const text = await file.text();
      const projectData = JSON.parse(text);
      console.log(projectData);

      if (projectData.width && projectData.height) {
        this.canvas.setDimensions({
          width: projectData.width,
          height: projectData.height,
        });
      } else {
        const tipo = localStorage.getItem('tipeBlank');
        if (tipo === 'horizontal') {
          this.canvas.setDimensions({ width: 1100, height: 850 });
        } else {
          this.canvas.setDimensions({ width: 500, height: 700 });
        }
      }

      this.canvas.loadFromJSON(projectData, () => {
        this.canvas.requestRenderAll();

        const orientacion =
          this.canvas.getWidth() > this.canvas.getHeight()
            ? 'horizontal'
            : 'vertical';
        localStorage.setItem('tipeBlank', orientacion);
      });
    } catch (err) {
      console.error('Error al abrir:', err);
    }
  }

  exportAs(format: 'png' | 'jpeg' | 'webp') {
    const data = this.canvas.toDataURL({
      format: format,
      quality: 0.9,
      multiplier: 3,
    });

    const link = document.createElement('a');
    link.href = data;
    link.download = `mi_diseno.${format}`;
    link.click();
  }

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
    if (!obj) {
      console.warn('Selecciona un objeto para bloquear/desbloquear');
      return;
    }

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
  // Fabric llama 'textbox' al texto y 'image' a las imágenes
  this.selectedObjectType = selectedObject.type;
}


}
