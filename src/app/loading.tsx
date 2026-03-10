/**
 * דף Loading גלובלי
 */

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl">🕊️</div>
          </div>
        </div>
        
        {/* טקסט */}
        <div className="space-y-2">
          <p className="text-lg font-semibold font-hebrew">טוען...</p>
          <p className="text-sm text-muted-foreground">
            המערכת מכינה את הנתונים עבורך
          </p>
        </div>
      </div>
    </div>
  );
}
