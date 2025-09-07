import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

//private url = 'http://157.175.235.195:5075/api';  
private url = 'https://api.ifagate-petzone.theworkpc.com/api'

  constructor(private http:HttpClient) { }

  async uploadImage(file: File): Promise<string> {
    const url = this.url+'/upload/image'
    console.log(url)
    try {
      // Step 1: Get pre-signed URL from the backend
      const response: any = await this.http.post(url, {
        fileName: file.name,
        fileType: file.type
      }).toPromise();

      const uploadUrl = response.uploadUrl;

      // Step 2: Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      // Return the public S3 URL
      return uploadUrl.split('?')[0]; // Remove query params from URL
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  async uploadDoc(file: File): Promise<string> {
    const url = this.url+'/upload/document'
    console.log(url)
    try {
      // Step 1: Get pre-signed URL from the backend
      const response: any = await this.http.post(url, {
        fileName: file.name,
        fileType: file.type
      }).toPromise();

      const uploadUrl = response.uploadUrl;

      // Step 2: Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      // Return the public S3 URL
      return uploadUrl.split('?')[0]; // Remove query params from URL
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }
}