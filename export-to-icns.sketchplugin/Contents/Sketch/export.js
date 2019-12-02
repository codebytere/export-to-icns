let doc;
let artboards;
let pngPath;
let fileManager;

// Generate the actual .icns file at the specified location.
function generateIcon(iconsetPath, iconPath) {
  console.log('generateIcon: Generating icon for iconset');

  const createTask = NSTask.alloc().init();
  const createIcon = `iconutil -c icns "${iconsetPath}" --out "${iconPath}"`;

  createTask.setLaunchPath('/bin/bash');
  createTask.setArguments(['-c', createIcon]);
  createTask.launch();
  createTask.waitUntilExit();

  if (createTask.terminationStatus() == 0) {
    doc.showMessage('Export Complete...');
  } else {
    const error = NSTask.alloc().init();

    error.setLaunchPath('/bin/bash');
    error.launch();
    doc.showMessage('Export Failed');
  }

  fileManager.removeItemAtPath_error(iconsetPath, null);
  fileManager.removeItemAtPath_error(pngPath, null);
}

// Choose where to save the exported .icns file.
function savePath() {
  console.log('savePath: Saving file to path');

  const fileName = doc.displayName().stringByDeletingPathExtension();
  const savePanel = NSSavePanel.savePanel();
  let filePath = '~';
  if (doc.fileURL()) {
    filePath = doc
      .fileURL()
      .path()
      .stringByDeletingLastPathComponent();
  }

  savePanel.setTitle('Export ICNS');
  savePanel.setNameFieldLabel('Export As:');
  savePanel.setPrompt('Export');
  savePanel.setAllowedFileTypes(['icns']);
  savePanel.setAllowsOtherFileTypes(false);
  savePanel.setCanCreateDirectories(true);
  savePanel.setDirectoryURL(NSURL.fileURLWithPath(filePath));
  savePanel.setNameFieldStringValue(fileName);

  if (savePanel.runModal() !== NSOKButton) exit;
  return savePanel.URL().path();
}

// Generates .icns file automatically from a single artboard.
function generateIconFileAutomatically(iconsetPath, iconPath) {
  let artboard = artboards.firstObject();
  for (let i = 0; i < artboards.count(); i++) {
    const current = artboards.objectAtIndex(i);
    if (artboards.objectAtIndex(i).isSelected()) {
      artboard = current;
      break;
    }
  }

  doc.saveArtboardOrSlice_toFile(artboard, pngPath);

  const pngSizes = {
    '16': 'icon_16x16.png',
    '32': 'icon_16x16@2x.png',
    '32': 'icon_32x32.png',
    '64': 'icon_32x32@2x.png',
    '128': 'icon_128x128.png',
    '256': 'icon_128x128@2x.png',
    '256': 'icon_256x256.png',
    '512': 'icon_256x256@2x.png',
    '512': 'icon_512x512.png',
    '1024': 'icon_512x512@2x.png'
  };

  for (const [size, pathComponent] of Object.entries(pngSizes)) {
    const convertTask = NSTask.alloc().init();
    const outPath = iconsetPath.stringByAppendingPathComponent(pathComponent);
    const convertIcon = `sips -z ${size} ${size} ${pngPath} --out ${outPath}`;

    convertTask.setLaunchPath('/bin/bash');
    convertTask.setArguments(['-c', convertIcon]);
    convertTask.launch();
    convertTask.waitUntilExit();
  }

  generateIcon(iconsetPath, iconPath);
}

// Generates .icns from a sequence of artboards.
function generateIconFileFromSequence(iconsetPath, iconPath) {
  for (let i = 0; i < artboards.count(); i++) {
    const artboard = artboards.objectAtIndex(i);
    const artboardName = artboard.name();
    const fileName = iconsetPath.stringByAppendingPathComponent(
      `${artboardName}.png`
    );
    if (artboardName.hasSuffix('Lock')) continue;
    doc.saveArtboardOrSlice_toFile(artboard, fileName);
  }

  generateIcon(iconsetPath, iconPath);
}

// Primary script function.
function exportToIcns(context) {
  doc = context.document;
  artboards = doc.currentPage().artboards();

  if (artboards.count() < 1) {
    console.log('Exiting: No artboards could be found');
    const error = NSTask.alloc().init();
  
    error.setLaunchPath('/bin/bash');
    error.launch();
    doc.showMessage('Error: No artboards could be found');
    return;
  }
  
  const alert = NSAlert.alloc().init();
  alert.setMessageText('ICNS Export Options');
  alert.setInformativeText(
    'Create and exports ICNS files from either a sequence of or single artboard to a location of your choosing.'
  );
  alert.addButtonWithTitle('Continue');
  alert.addButtonWithTitle('Cancel');
  
  const menuPopup = NSPopUpButton.alloc().initWithFrame(
    NSMakeRect(0, 0, 300, 25)
  );
  menuPopup.addItemsWithTitles(['Automatically', 'From Sequence']);
  alert.setAccessoryView(menuPopup);
  
  const response = alert.runModal();
  const menuItem = menuPopup.indexOfSelectedItem();
  const tempPath = NSTemporaryDirectory();
  const string = NSProcessInfo.processInfo().globallyUniqueString();
  const iconsetPath = tempPath.stringByAppendingPathComponent(
    `${string}.iconset`
  );
  pngPath = tempPath.stringByAppendingPathComponent(`${string}.png`);
  fileManager = NSFileManager.defaultManager();
  
  fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(
    iconsetPath,
    true,
    null,
    null
  );

  // If user selects 'Continue'
  if (response === NSAlertFirstButtonReturn) {
    iconPath = savePath();
  
    if (menuItem === 0) {
      generateIconFileAutomatically(iconsetPath, iconPath);
    } else {
      generateIconFileFromSequence(iconsetPath, iconPath)
    }
  
    return [response, menuItem];

  // If user selects 'Cancel'
  } else if (response === NSAlertSecondButtonReturn) {
    console.log('Exiting: user cancelled export');
  
    doc.showMessage('Export Process Cancelled');
    return;
  }
}
