import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LoadingSpinner } from "../ui/loading-spinner";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { 
  Folder, 
  File, 
  ArrowLeft, 
  Search, 
  Download,
  Check,
  AlertCircle,
  Loader2,
  LogOut
} from "lucide-react";
import { googleDriveService, GoogleDriveFile, GoogleDriveFolder } from "../../lib/googleDrive";
import { useToast } from "../../hooks/use-toast";

interface GoogleDrivePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: GoogleDriveFile) => void;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export function GoogleDrivePicker({ open, onOpenChange, onFileSelect }: GoogleDrivePickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: 'root', name: 'Meu Drive' }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      initializeDrive();
    }
  }, [open]);

  const initializeDrive = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await googleDriveService.initialize();
      const authenticated = googleDriveService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        await loadFiles();
      }
    } catch (error) {
      console.error('Erro ao inicializar Google Drive:', error);
      setError('Google Drive não está configurado. Configure as credenciais no arquivo .env');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);
      
      const success = await googleDriveService.signIn();
      if (success) {
        setIsAuthenticated(true);
        await loadFiles();
        toast({
          title: "Conectado com sucesso",
          description: "Você foi conectado ao Google Drive",
        });
      } else {
        setError('Falha na autenticação');
      }
    } catch (error) {
      console.error('Erro na autenticação:', error);
      setError('Erro na autenticação');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loadFiles = async (folderId: string = currentFolderId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await googleDriveService.getFiles(folderId);
      setFiles(result.files);
      setFolders(result.folders);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      setError('Erro ao carregar arquivos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folder: GoogleDriveFolder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
    loadFiles(folder.id);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    const folderId = newBreadcrumbs[newBreadcrumbs.length - 1].id;
    setCurrentFolderId(folderId);
    loadFiles(folderId);
  };

  const handleFileClick = (file: GoogleDriveFile) => {
    setSelectedFile(file);
  };

  const handleSelectFile = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
      onOpenChange(false);
      setSelectedFile(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleDriveService.signOut();
      setIsAuthenticated(false);
      setFiles([]);
      setFolders([]);
      setCurrentFolderId('root');
      setBreadcrumbs([{ id: 'root', name: 'Meu Drive' }]);
      setSelectedFile(null);
      setSearchTerm('');
      setError(null);
      toast({
        title: "Desconectado",
        description: "Você foi desconectado do Google Drive",
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: "Erro",
        description: "Erro ao desconectar do Google Drive",
        variant: "destructive",
      });
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (size?: string) => {
    if (!size) return '';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation')) return '📽️';
    return '📄';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle>Selecionar arquivo do Google Drive</DialogTitle>
              <DialogDescription>
                Escolha um arquivo do seu Google Drive para anexar à conversa
              </DialogDescription>
            </div>
            {isAuthenticated && (
              <div className="ml-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {!isAuthenticated ? (
            <div className="flex-1 flex items-center justify-center py-12 px-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto">
                  <Download className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Conectar ao Google Drive</h3>
                  <p className="text-muted-foreground">
                    {error ? (
                      <span className="text-red-600 dark:text-red-400">
                        {error}
                      </span>
                    ) : (
                      "Faça login para acessar seus arquivos do Google Drive"
                    )}
                  </p>
                  {error && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Para configurar:</strong> Edite o arquivo <code>.env</code> na pasta frontend/ 
                        e adicione suas credenciais do Google Drive API.
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                        Consulte o arquivo <code>GOOGLE_DRIVE_SETUP.md</code> para instruções detalhadas.
                      </p>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleSignIn} 
                  disabled={isAuthenticating || !!error}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    'Conectar ao Google Drive'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 space-y-4">
                {/* Breadcrumbs */}
                <div className="flex items-center space-x-2 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.id} className="flex items-center">
                      {index > 0 && <span className="text-muted-foreground mx-2">/</span>}
                      <button
                        onClick={() => handleBreadcrumbClick(index)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {crumb.name}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar arquivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Files and Folders */}
              <div className="flex-1 overflow-hidden px-6">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-2 pb-4">
                      {/* Folders */}
                      {filteredFolders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => handleFolderClick(folder)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Folder className="h-5 w-5 text-blue-500" />
                          <div className="flex-1">
                            <p className="font-medium">{folder.name}</p>
                            <p className="text-sm text-muted-foreground">Pasta</p>
                          </div>
                        </div>
                      ))}

                      {/* Files */}
                      {filteredFiles.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleFileClick(file)}
                          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors ${
                            selectedFile?.id === file.id ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' : ''
                          }`}
                        >
                          <span className="text-lg">{getFileIcon(file.mimeType)}</span>
                          <div className="flex-1">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {new Date(file.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedFile?.id === file.id && (
                            <Check className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      ))}

                      {filteredFolders.length === 0 && filteredFiles.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-muted-foreground">
                          Nenhum arquivo encontrado
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t bg-background">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSelectFile} 
                    disabled={!selectedFile}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Selecionar Arquivo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
