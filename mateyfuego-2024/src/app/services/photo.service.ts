import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  collectionData,
  doc,
  updateDoc,
  increment,
  where,
  getDocs,
  writeBatch,
  DocumentData,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private firestore: Firestore = inject(Firestore);
  private storage: Storage = inject(Storage);

  constructor(private auth: Auth, private photoService: PhotoService) {}

  async takePhoto(source: CameraSource) {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source,
      width: 800,
      height: 600,
    });
    return image;
  }

  async uploadPhoto(
    imageData: string,
    type: 'duenosSupervisores',
    userName: string
  ) {
    const user = this.auth.currentUser;

    if (!user) {
      console.error('No hay usuario logueado. No se puede subir la foto.');
      return;
    }

    const fileName = `${new Date().getTime()}.jpeg`;
    const filePath = `imagenes/${type}/${fileName}`;
    const storageRef = ref(this.storage, filePath);

    const response = await fetch(`data:image/jpeg;base64,${imageData}`);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);

    console.log(`Imagen guardada en: ${filePath} con el nombre: ${fileName}`);

    const colRef = collection(this.firestore, type);
    return addDoc(colRef, {
      fotoUrl: downloadUrl,
    });
  }

  getPhotos(type: 'duenosSupervisores'): Observable<any[]> {
    const colRef = collection(this.firestore, type);
    const q = query(colRef, orderBy('timestamp', 'desc'));
    const photos$ = collectionData(q, { idField: 'id' });

    photos$.subscribe((photos) => {
      console.log('Fotos obtenidas:', photos);
    });

    return photos$;
  }

  getUserPhotosUser(
    userName: string,
    type: 'duenosSupervisores'
  ): Observable<any[]> {
    const colRef = collection(this.firestore, type);

    const q = query(
      colRef,
      where('userName', '==', userName),
      orderBy('timestamp', 'desc')
    );

    const photos$ = collectionData(q, { idField: 'id' });

    photos$.subscribe((photos) => {
      console.log(`Fotos obtenidas para el usuario ${userName}:`, photos);
    });

    return photos$;
  }
}
