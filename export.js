const doc = context.document
const artboards = doc.currentPage().artboards()

if (artboards.count() < 1) {
  const error = NSTask.alloc().init()

  error.setLaunchPath("/bin/bash")
  error.setArguments(["-c", "afplay /System/Library/Sounds/Basso.aiff"])
  error.launch()
  doc.showMessage("Error: Artboard Not Found")
  return false
}

const menuPopup = NSPopUpButton.alloc().initWithFrame(NSMakeRect(0,0,300,25))
menuPopup.addItemsWithTitles(NSArray.arrayWithArray(['Automatically', 'From Sequence']))

const alert = NSAlert.alloc().init()
alert.setMessageText('ICNS Export Options')
alert.setInformativeText('Generate ICNS files from a sequence of artboards or automatically from a single artboard.')
alert.addButtonWithTitle('Continue')
alert.addButtonWithTitle('Cancel')
alert.setAccessoryView(menuPopup)

const response = alert.runModal()
const menuItem = menuPopup.indexOfSelectedItem()
const tempPath = NSTemporaryDirectory()
const string = NSProcessInfo.processInfo().globallyUniqueString()
const iconsetPath = tempPath.stringByAppendingPathComponent(`${string}.iconset`)
const pngPath = tempPath.stringByAppendingPathComponent(`${string}.png`)
const fileManager = NSFileManager.defaultManager()

[fileManager createDirectoryAtPath:iconsetPath withIntermediateDirectories:true attributes:nil error:nil]

if (response === NSAlertFirstButtonReturn) {
  iconPath = savePath()

  if (menuItem == 0) {
    for (let i = 0; i < artboards.count(); i++) {
      const current = artboards.objectAtIndex(i)
      if (current.isSelected()) {
        artboard = current
        break
      } else {
        artboard = artboards.firstObject()
      }
    }

    [doc saveArtboardOrSlice:artboard toFile:pngPath]

    const pngSizes = { 
      "16": "icon_16x16.png",
      "32": "icon_16x16@2x.png",
      "32": "icon_32x32.png",
      "64": "icon_32x32@2x.png",
      "128": "icon_128x128.png",
      "256": "icon_128x128@2x.png",
      "256": "icon_256x256.png",
      "512": "icon_256x256@2x.png",
      "512": "icon_512x512.png",
      "1024": "icon_512x512@2x.png", 
    };

    for (const [size, pathComponent] of Object.entries(pngSizes)) {
      const convertTask = NSTask.alloc().init()
      const outPath = iconsetPath.stringByAppendingPathComponent(pathComponent)
      const convertIcon  = `sips -z ${size} ${size} ${pngPath} --out ${outPath}`

      convertTask.setLaunchPath("/bin/bash")
      convertTask.setArguments(["-c", convertIcon])
      convertTask.launch()
      convertTask.waitUntilExit()
    }
    generateIcon(iconsetPath, iconPath)
  }

  if (menuItem === 1) {
    for (let i = 0; i < artboards.count(); i++) {
      const artboard = artboards.objectAtIndex(i)
      const artboardName = artboard.name()
      const fileName = iconsetPath.stringByAppendingPathComponent(`${artboardName}.png`)
      if (artboardName.hasSuffix("Lock")) continue

      [doc saveArtboardOrSlice:artboard toFile:fileName]
    }
    generateIcon(iconsetPath, iconPath)
  }

  function generateIcon(iconsetPath, iconPath) {
    const createTask = NSTask.alloc().init()
    const createIcon = "iconutil -c icns \"" + iconsetPath + "\" --out \"" + iconPath + "\""

    createTask.setLaunchPath("/bin/bash")
    createTask.setArguments(["-c", createIcon])
    createTask.launch()
    createTask.waitUntilExit()

    if (createTask.terminationStatus() == 0) {
      doc.showMessage("Export Complete...")
    } else {
      const error = NSTask.alloc().init()

      error.setLaunchPath("/bin/bash")
      error.setArguments(["-c", "afplay /System/Library/Sounds/Basso.aiff"])
      error.launch()
      doc.showMessage("Export Failed...")
    }

    [fileManager removeItemAtPath:iconsetPath error:nil];
    [fileManager removeItemAtPath:pngPath error:nil];
  }

  function savePath() {
    const fileName = doc.displayName().stringByDeletingPathExtension()
    const savePanel = NSSavePanel.savePanel()
    let filePath = "~"
    if (doc.fileURL()) filePath = doc.fileURL().path().stringByDeletingLastPathComponent()

    savePanel.setTitle("Export ICNS")
    savePanel.setNameFieldLabel("Export As:")
    savePanel.setPrompt("Export")
    savePanel.setAllowedFileTypes(["icns"])
    savePanel.setAllowsOtherFileTypes(false)
    savePanel.setCanCreateDirectories(true)
    savePanel.setDirectoryURL(NSURL.fileURLWithPath(filePath))
    savePanel.setNameFieldStringValue(fileName)

    if (savePanel.runModal() !== NSOKButton) exit
    return savePanel.URL().path()
  }

  return [response, menuItem]
}