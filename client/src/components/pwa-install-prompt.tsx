import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { usePWA } from "@/hooks/use-pwa";
import { Download, X, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isStandalone, promptInstall, dismissPrompt } = usePWA();

  // Don't show if already installed or not installable
  if (isInstalled || isStandalone || !isInstallable) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Install tandembrain
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissPrompt}
            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs text-blue-700 dark:text-blue-300">
          Add to your home screen for quick access and offline use
        </CardDescription>
      </CardHeader>
      <CardFooter className="pt-0">
        <Button 
          onClick={promptInstall}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Install App
        </Button>
      </CardFooter>
    </Card>
  );
}