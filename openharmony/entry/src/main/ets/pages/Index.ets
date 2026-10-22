import { webview } from '@kit.ArkWeb';
import { photoAccessHelper } from '@kit.MediaLibraryKit';
import { picker, fileIo } from '@kit.CoreFileKit';
import { util } from '@kit.ArkTS';
import { promptAction } from '@kit.ArkUI';
import { BusinessError } from '@kit.BasicServicesKit';

/**
 * Bridge exposed to the offline page as `window.ohosBridge`.
 * Saving uses the system document picker, so the app never needs a
 * broad storage permission and works on both OpenHarmony and HarmonyOS.
 */
class OhosBridge {
  saveImage(base64Data: string, fileName: string): void {
    this.writeImage(base64Data, fileName).catch((error: BusinessError) => {
      promptAction.showToast({ message: `未保存：${error.message}`, duration: 3500 });
    });
  }

  showError(message: string): void {
    promptAction.showToast({ message, duration: 3500 });
  }

  private async writeImage(base64Data: string, fileName: string): Promise<void> {
    try {
      promptAction.showToast({ message: '请选择保存位置', duration: 1800 });

      const documentPicker = new picker.DocumentViewPicker();
      const options = new picker.DocumentSaveOptions();
      options.newFileNames = [fileName.endsWith('.png') ? fileName : `${fileName}.png`];

      const uris = await documentPicker.save(options);
      if (!uris || uris.length === 0) {
        return;
      }

      const bytes = new util.Base64Helper().decodeSync(base64Data);
      const file = fileIo.openSync(
        uris[0],
        fileIo.OpenMode.READ_WRITE | fileIo.OpenMode.CREATE | fileIo.OpenMode.TRUNC
      );
      try {
        fileIo.writeSync(file.fd, bytes.buffer as ArrayBuffer);
      } finally {
        fileIo.closeSync(file);
      }

      promptAction.showToast({ message: '海报已保存。', duration: 2500 });
    } catch (error) {
      const err = error as BusinessError;
      const message = err.message ? err.message : String(err);
      promptAction.showToast({ message: `未保存：${message}`, duration: 3500 });
    }
  }
}

@Entry
@Component
struct Index {
  private controller: webview.WebviewController = new webview.WebviewController();
  private bridge: OhosBridge = new OhosBridge();

  build() {
    Column() {
      Web({ src: $rawfile('index.html'), controller: this.controller })
        .javaScriptAccess(true)
        .fileAccess(true)
        .domStorageAccess(true)
        .imageAccess(true)
        .onlineImageAccess(false)
        .mixedMode(webview.MixedMode.None)
        .javaScriptProxy({
          object: this.bridge,
          name: 'ohosBridge',
          methodList: ['saveImage', 'showError'],
          controller: this.controller
        })
        .onShowFileSelector((event) => {
          if (!event.fileSelector.isMimeTypeAcceptable('image/*')) {
            return false;
          }

          const options = new photoAccessHelper.PhotoSelectOptions();
          options.MIMEType = photoAccessHelper.PhotoViewMIMETypes.IMAGE_TYPE;
          options.maxSelectNumber = 1;

          const photoPicker = new photoAccessHelper.PhotoViewPicker();
          photoPicker.select(options).then((result) => {
            if (result.photoUris.length > 0) {
              event.result.handleFileList(result.photoUris);
            } else {
              event.result.handleFileList([]);
            }
          }).catch((error: BusinessError) => {
            promptAction.showToast({ message: `无法选择照片：${error.message}`, duration: 3000 });
          });

          return true;
        })
        .width('100%')
        .height('100%')
    }
    .width('100%')
    .height('100%')
  }
}
