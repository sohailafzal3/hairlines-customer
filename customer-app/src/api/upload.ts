import { apiClient } from './client';

export const UploadApi = {
  uploadProfileImage: (formData: FormData) =>
    apiClient.uploadFile('upload/profile-image', formData),

  uploadGeneralImage: (formData: FormData) =>
    apiClient.uploadFile('upload/general/image', formData),

  uploadStylePreference: (formData: FormData) =>
    apiClient.uploadFile('upload/style-preference', formData),

  uploadIdentityDocuments: (formData: FormData) =>
    apiClient.uploadFile('driver/upload/identity/documents', formData),

  uploadImage: (formData: FormData) =>
    apiClient.uploadFile('upload/image', formData),
};
