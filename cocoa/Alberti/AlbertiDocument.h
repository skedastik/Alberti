//
//  AlbertiDocument.h
//  Alberti
//
//  Created by Alaric Holloway on 5/24/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface AlbertiDocument : NSDocument {
@private
    WebView *webView;
    NSTableView *layerTableView;
    
    NSData *xhtmlData;
}

@property (assign) IBOutlet WebView *webView;
@property (assign) IBOutlet NSTableView *layerTableView;

@end
