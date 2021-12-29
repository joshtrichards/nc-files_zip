import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'
import { showError, showSuccess } from '@nextcloud/dialogs'

(function() {
	const FilesPlugin = {
		attach(fileList) {
			fileList.registerMultiSelectFileAction({
				name: 'files_zip',
				displayName: t('files_zip', 'Compress to zip'),
				iconClass: 'icon-zip',
				order: 0,
				action: (files) => {
					const parentFolderName = files.length === 1 ? files[0].name : fileList.getCurrentDirectory().split('/').slice(-1).pop()
					const suggestedFilename = fileList.getUniqueName(
						(parentFolderName === '' ? t('files_zip', 'Archive') : parentFolderName) + '.zip'
					)

					const selectedFiles = files.map(file => file.id)
					// noinspection JSVoidFunctionReturnValueUsed
					window.OC.dialogs.prompt(
						t('files_zip', 'Select a name for the zip archive'),
						n('files_zip', 'Compress {files} file', 'Compress {files} files', selectedFiles.length, { files: selectedFiles.length }),
						(result, target) => {
							if (result) {
								this.compressFiles(selectedFiles, fileList.getCurrentDirectory() + '/' + target)
							}
						}, true, t('files_zip', 'File name')
					).then(this.enhancePrompt.bind(this, suggestedFilename))
				},
			})

			fileList.$el.on('urlChanged', data => {
				const canCreate = !!(fileList.dirInfo.permissions & OC.PERMISSION_CREATE)
				fileList.fileMultiSelectMenu.toggleItemVisibility('files_zip', canCreate)
			})
			fileList.$el.on('afterChangeDirectory', data => {
				const canCreate = !!(fileList.dirInfo.permissions & OC.PERMISSION_CREATE)
				fileList.fileMultiSelectMenu.toggleItemVisibility('files_zip', canCreate)
			})
		},
		async compressFiles(fileIds, target) {
			try {
				await axios.post(generateOcsUrl('apps/files_zip/api/v1/zip'), {
					fileIds,
					target,
				})
				showSuccess('Creating zip archive started. We will notify you as soon as the archive is available.')
			} catch (e) {
				showError('An error happened when trying to compress the file.')
			}
		},

		enhancePrompt(suggestedFilename) {
			const dialog = document.querySelector('.oc-dialog')
			const input = dialog.querySelector('input[type=text]')
			const buttons = dialog.querySelectorAll('button')

			const icon = dialog.querySelector('.ui-icon')
			icon.parentNode.removeChild(icon)

			buttons[0].innerText = t('files_zip', 'Cancel')
			buttons[1].innerText = t('files_zip', 'Compress files')
			input.value = suggestedFilename
		},
	}

	OC.Plugins.register('OCA.Files.FileList', FilesPlugin)
})()
