Option Explicit
Dim shell, fso, projectDir, extensionDir, chromePath, candidates, candidate
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
projectDir = fso.GetParentFolderName(WScript.ScriptFullName)
extensionDir = fso.BuildPath(projectDir, "extension")

If Not fso.FileExists(fso.BuildPath(extensionDir, "manifest.json")) Then
  MsgBox "The extension files are missing. Extract the complete KMoon Web Analyzer download first.", 16, "KMoon Web Analyzer"
  WScript.Quit 1
End If

candidates = Array( _
  shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe", _
  shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Google\Chrome\Application\chrome.exe", _
  shell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Google\Chrome\Application\chrome.exe")
chromePath = ""
For Each candidate In candidates
  If fso.FileExists(candidate) Then
    chromePath = candidate
    Exit For
  End If
Next

If MsgBox("This opens Chrome's extension page and the correct extension folder." & vbCrLf & vbCrLf & _
  "In Chrome, turn on Developer mode, click Load unpacked, and select the folder that opens. " & _
  "Chrome requires this one-time approval for locally installed extensions.", _
  vbOKCancel + vbInformation, "Install KMoon Web Analyzer") <> vbOK Then
  WScript.Quit 0
End If

If chromePath <> "" Then
  shell.Run """" & chromePath & """ chrome://extensions", 1, False
Else
  shell.Run "chrome://extensions", 1, False
End If
shell.Run "explorer.exe """ & extensionDir & """", 1, False
