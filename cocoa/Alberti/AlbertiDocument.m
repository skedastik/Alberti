//
//  AlbertiDocument.m
//  Alberti
//
//  Created by Alaric Holloway on 5/24/11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import "AlbertiDocument.h"

@interface AlbertiDocument ()

- (void)setDocumentXhtml: (NSString *)body;

@end

@implementation AlbertiDocument
@synthesize webView;
@synthesize layerTableView;

- (id)init
{
    self = [super init];
    if (self) {
        
        // xhtml essentially represents the Alberti document
        xhtmlData = NULL;
    }
    return self;
}

- (NSString *)windowNibName
{
    return @"AlbertiDocument";
}

- (void)windowControllerDidLoadNib:(NSWindowController *)aController
{
    [super windowControllerDidLoadNib:aController];
    
    // Create an empty document if XHTML data has not been read in
    if (xhtmlData == NULL) {
        [self setDocumentXhtml:NULL];
    }
    
    [[webView mainFrame] loadData:xhtmlData MIMEType:@"application/xhtml+xml" textEncodingName:@"utf-8" baseURL:NULL];
}

- (NSData *)dataOfType:(NSString *)typeName error:(NSError **)outError {
    if (outError) {
        *outError = [NSError errorWithDomain:NSOSStatusErrorDomain code:unimpErr userInfo:NULL];
    }
    
    return nil;
}

- (BOOL)readFromData:(NSData *)data ofType:(NSString *)typeName error:(NSError **)outError {
    if (outError) {
        *outError = [NSError errorWithDomain:NSOSStatusErrorDomain code:unimpErr userInfo:NULL];
    }
    
    return YES;
}

// Wraps the given XHTML body string with appropriate Alberti web headers and 
// footers and uses the result as the XHTML document. A default body string will 
// be supplied if body is nil.
- (void)setDocumentXhtml:(NSString *)body {
    NSBundle *mainBundle = [NSBundle mainBundle];
    
    NSString *footerPath = [mainBundle pathForResource:@"footer" ofType:NULL];
    NSString *headerPath = [mainBundle pathForResource:@"header" ofType:NULL];
    
    // Load document template strings
    NSString *docFooter = [NSString stringWithContentsOfFile:footerPath encoding:NSUTF8StringEncoding error:NULL];
    NSString *docHeader = [NSString stringWithContentsOfFile:headerPath encoding:NSUTF8StringEncoding error:NULL];
    
    if (body == NULL) {
        NSString *bodyPath = [mainBundle pathForResource:@"body" ofType:NULL];
        body = [NSString stringWithContentsOfFile:bodyPath encoding:NSUTF8StringEncoding error:NULL];
    }
    
    NSString *xhtmlString = [NSString stringWithFormat:@"%@%@%@", docHeader, body, docFooter];
    xhtmlData = [xhtmlString dataUsingEncoding:NSUTF8StringEncoding];
}

@end
