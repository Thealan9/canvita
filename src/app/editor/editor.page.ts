import { Component, AfterViewInit } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Canvas, Textbox, Image as FabricImage } from 'fabric';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.page.html',
  styleUrls: ['./editor.page.scss'],
  standalone: false,
})
export class EditorPage implements AfterViewInit {
  canvas!: Canvas;
  currentFile: FileSystemFileHandle | null = null;

  ngAfterViewInit() {
    this.canvas = new Canvas('canvas');
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
      this.canvas.renderAll();
    }
  }

  changeFontSize(event: any) {
    const obj: any = this.canvas.getActiveObject();
    if (obj && obj.type === 'textbox') {
      obj.set('fontSize', event.detail.value);
      this.canvas.renderAll();
    }
  }

  async save() {
    if (!this.currentFile) {
      return this.saveAs();
    }

    const json = JSON.stringify(this.canvas.toJSON());

    const writable = await this.currentFile.createWritable();
    await writable.write(json);
    await writable.close();

    alert('Guardado');
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

  async open() {
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

    console.log('JSON:', text);

    this.canvas.loadFromJSON(text, () => {
      this.canvas.requestRenderAll();
    });
  }

  exportPNG() {
    const data = this.canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.href = data;
    link.download = 'diseño.png';
    link.click();
  }
}
