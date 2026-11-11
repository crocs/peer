#ifndef PeerVersion
  #error Pass /DPeerVersion=<package version> after building the browser packages.
#endif

[Setup]
AppId=PeerExtensionSetup
AppName=peer
AppVersion={#PeerVersion}
AppPublisher=crocs
DefaultDirName={localappdata}\Programs\peer
PrivilegesRequired=lowest
DisableDirPage=yes
DisableProgramGroupPage=yes
DisableReadyPage=yes
WizardStyle=modern
SetupIconFile=..\.output\setup-art\peer.ico
WizardImageFile=..\.output\setup-art\sidebar.png
WizardSmallImageFile=..\.output\setup-art\header.png
UninstallDisplayIcon={app}\peer.ico
OutputDir=..\.output
OutputBaseFilename=peer-{#PeerVersion}-windows-setup
Compression=lzma2
SolidCompression=yes
CloseApplications=no
RestartApplications=no

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"
Name: "ru"; MessagesFile: "compiler:Languages\Russian.isl"

[CustomMessages]
en.SetupTitle=Set up peer
ru.SetupTitle=Установка peer
en.Choose=Choose your browser
ru.Choose=Выберите браузер
en.SelectBrowser=Setup prepares the files. You finish in your browser.
ru.SelectBrowser=Установщик подготовит файлы. Последний шаг вы выполните в браузере.
en.Unpacked=Unpacked extension
ru.Unpacked=Распакованное расширение
en.Temporary=Temporary add-on
ru.Temporary=Временное дополнение
en.Final=Finish in %1
ru.Final=Завершите установку в %1
en.ChromiumStep=Open %1, enable Developer mode, and click Load unpacked. Paste this folder into the folder picker. For an update to an existing installation from this folder, click Reload on peer.
ru.ChromiumStep=Откройте %1, включите режим разработчика и нажмите «Загрузить распакованное расширение». Вставьте путь в окно выбора папки. Если peer уже загружен из этой папки, нажмите кнопку обновления на его карточке.
en.GeckoStep=Open %1, choose Load Temporary Add-on, and paste the ZIP path into the file picker. This preview lasts until you restart the browser.
ru.GeckoStep=Откройте %1, нажмите «Загрузить временное дополнение» и вставьте путь к ZIP в окно выбора файла. Эта версия работает до перезапуска браузера.
en.Copy=Copy path
ru.Copy=Скопировать путь
en.Open=Open %1
ru.Open=Открыть %1
en.Manual=Open %1 manually and enter %2 in the address bar.
ru.Manual=Откройте %1 вручную и введите %2 в адресную строку.

[Files]
Source: "..\.output\setup-art\peer.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\.output\chrome-mv3\*"; DestDir: "{app}\chrome"; Flags: recursesubdirs ignoreversion; Excludes: "_metadata\*"; Check: ChromeSelected
Source: "..\.output\edge-mv3\*"; DestDir: "{app}\edge"; Flags: recursesubdirs ignoreversion; Excludes: "_metadata\*"; Check: EdgeSelected
Source: "..\.output\peer-{#PeerVersion}-firefox.zip"; DestDir: "{app}"; DestName: "peer-firefox.zip"; Flags: ignoreversion; Check: GeckoSelected

[Code]
var
  Choice: TInputOptionWizardPage;
  PathField: TNewEdit;
  CopyButton, OpenButton: TNewButton;

function ChromeSelected: Boolean;
begin Result := Choice.SelectedValueIndex = 0; end;
function EdgeSelected: Boolean;
begin Result := Choice.SelectedValueIndex = 1; end;
function GeckoSelected: Boolean;
begin Result := Choice.SelectedValueIndex >= 2; end;

function BrowserPage: String;
begin
  if ChromeSelected then Result := 'chrome://extensions'
  else if EdgeSelected then Result := 'edge://extensions'
  else Result := 'about:debugging#/runtime/this-firefox';
end;

function BrowserName: String;
begin Result := Choice.CheckListBox.Items[Choice.SelectedValueIndex]; end;

procedure CopyPath(Sender: TObject);
begin
  PathField.SelectAll;
  SendMessage(PathField.Handle, $0301, 0, 0);
end;

procedure OpenBrowser(Sender: TObject);
var ExeName, RelativePath, ExePath, Key: String; ErrorCode: Integer;
begin
  case Choice.SelectedValueIndex of
    0: begin ExeName := 'chrome.exe'; RelativePath := 'Google\Chrome\Application\'; end;
    1: begin ExeName := 'msedge.exe'; RelativePath := 'Microsoft\Edge\Application\'; end;
    2: begin ExeName := 'firefox.exe'; RelativePath := 'Mozilla Firefox\'; end;
    3: begin ExeName := 'librewolf.exe'; RelativePath := 'LibreWolf\'; end;
  end;
  Key := 'Software\Microsoft\Windows\CurrentVersion\App Paths\' + ExeName;
  if not RegQueryStringValue(HKCU, Key, '', ExePath) then
    if not RegQueryStringValue(HKLM, Key, '', ExePath) then ExePath := '';
  ExePath := RemoveQuotes(ExePath);
  if IsWin64 and not FileExists(ExePath) then
    ExePath := ExpandConstant('{commonpf64}\') + RelativePath + ExeName;
  if not FileExists(ExePath) then ExePath := ExpandConstant('{commonpf32}\') + RelativePath + ExeName;
  if not FileExists(ExePath) then ExePath := ExpandConstant('{localappdata}\') + RelativePath + ExeName;
  if FileExists(ExePath) then
    if Exec(ExePath, BrowserPage, '', SW_SHOWNORMAL, ewNoWait, ErrorCode) then Exit;
  MsgBox(FmtMessage(CustomMessage('Manual'), [BrowserName, BrowserPage]), mbInformation, MB_OK);
end;

procedure InitializeWizard;
begin
  Choice := CreateInputOptionPage(wpWelcome, CustomMessage('SetupTitle'), CustomMessage('SelectBrowser'), CustomMessage('Choose'), True, False);
  Choice.SubCaptionLabel.Font.Size := 14;
  Choice.SubCaptionLabel.Font.Style := [fsBold];
  Choice.SubCaptionLabel.AdjustHeight;
  Choice.CheckListBox.Top := Choice.SubCaptionLabel.Top + Choice.SubCaptionLabel.Height + ScaleY(8);
  Choice.CheckListBox.Height := Choice.SurfaceHeight - Choice.CheckListBox.Top;
  Choice.CheckListBox.Font.Size := 10;
  Choice.CheckListBox.MinItemHeight := ScaleY(36);
  Choice.Add('Google Chrome'); Choice.Add('Microsoft Edge'); Choice.Add('Firefox'); Choice.Add('LibreWolf');
  Choice.CheckListBox.ItemSubItem[0] := CustomMessage('Unpacked');
  Choice.CheckListBox.ItemSubItem[1] := CustomMessage('Unpacked');
  Choice.CheckListBox.ItemSubItem[2] := CustomMessage('Temporary');
  Choice.CheckListBox.ItemSubItem[3] := CustomMessage('Temporary');
  Choice.SelectedValueIndex := 0;
  PathField := TNewEdit.Create(WizardForm);
  PathField.Parent := WizardForm.FinishedPage;
  PathField.ReadOnly := True;
  CopyButton := TNewButton.Create(WizardForm);
  CopyButton.Parent := WizardForm.FinishedPage;
  CopyButton.Caption := CustomMessage('Copy');
  CopyButton.OnClick := @CopyPath;
  OpenButton := TNewButton.Create(WizardForm);
  OpenButton.Parent := WizardForm.FinishedPage;
  OpenButton.OnClick := @OpenBrowser;
end;

procedure CurPageChanged(CurPageID: Integer);
var LabelControl: TNewStaticText;
begin
  if CurPageID <> wpFinished then Exit;
  WizardForm.FinishedHeadingLabel.Caption := FmtMessage(CustomMessage('Final'), [BrowserName]);
  LabelControl := WizardForm.FinishedLabel;
  if GeckoSelected then begin
    LabelControl.Caption := FmtMessage(CustomMessage('GeckoStep'), [BrowserPage]);
    PathField.Text := ExpandConstant('{app}\peer-firefox.zip');
  end else begin
    LabelControl.Caption := FmtMessage(CustomMessage('ChromiumStep'), [BrowserPage]);
    if ChromeSelected then PathField.Text := ExpandConstant('{app}\chrome')
    else PathField.Text := ExpandConstant('{app}\edge');
  end;
  LabelControl.AdjustHeight;
  PathField.SetBounds(LabelControl.Left, LabelControl.Top + LabelControl.Height + ScaleY(12), LabelControl.Width, ScaleY(24));
  CopyButton.SetBounds(PathField.Left, PathField.Top + PathField.Height + ScaleY(8), ScaleX(112), ScaleY(25));
  OpenButton.SetBounds(CopyButton.Left + CopyButton.Width + ScaleX(5), CopyButton.Top, ScaleX(136), CopyButton.Height);
  OpenButton.Caption := FmtMessage(CustomMessage('Open'), [BrowserName]);
end;
