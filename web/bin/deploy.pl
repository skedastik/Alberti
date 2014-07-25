#!/usr/bin/perl
#
# Quick and dirty deploy script.
#
# Merge and minify js, CSS, and HTML into a single XHTML file for deployment
# at deploy/index.xhtml. Also copies images to deploy directory. You may 
# optionally supply a '--raw' argument to avoid minification.
#

$arg0 = $ARGV[0];
$minify = 1;

if ($arg0) {
	if ($arg0 ne '--raw') {
		print "deploy.pl: Illegal option '$arg0'.\nUse '--raw' to avoid minification.\n";
		exit;
	}
	
	$minify = 0;
}

print "Merging".($minify ? " and minifying" : "")."...\n";

$htdocsPath =   '../htdocs';                           # Path to htdocs
$htmlPath =     $htdocsPath.'/index.xhtml';            # Path to HTML file
$templatePath = $htdocsPath.'/template';               # Path to template directory
$varPath =      '../var';                              # Path to var directory
$deployPath =   '../deploy';                           # Path to template directory

$html = `cat $htmlPath`;
$html =~ m/(<link.*\/>)\s*(<script.*<\/script>).*(<body.*<\/body>)/ms;

$header1 = `cat $templatePath/header.1`;
$header2 = `cat $templatePath/header.2`;
$header3 = `cat $templatePath/header.3`;
$footer =  `cat $templatePath/footer`;

$cssList = $1;
$jsList = $2;
$body = $3;

$cssList =~ s/<link rel="stylesheet" href="(.*?)" type="text\/css" \/>\s*/$htdocsPath\/\1 /msg;
$jsList =~ s/<script type="text\/ecmascript" src="(.*?)"><\/script>\s*/$htdocsPath\/\1 /msg;

$css = `cat $cssList`;
$js = `cat $jsList`;

$css =~ s/url\('\.\.\/(.*?)'\)/url('\1')/msg;      # Correct paths

open FILE, ">$varPath/css" or die $!;
print FILE $css;
close FILE;

open FILE, ">$varPath/js" or die $!;
print FILE $js;
close FILE;

if ($minify) {
	$css = `java -jar yuicompressor-2.4.6.jar --type css $varPath/css`;
	$js = `java -jar yuicompressor-2.4.6.jar --type js --preserve-semi $varPath/js`;
}

# Deploy index.xhtml
open FILE, ">$deployPath/index.xhtml" or die $!;
print FILE $header1;
print FILE $css;
print FILE $header2;
print FILE $js;
print FILE $header3;
print FILE $body;
print FILE $footer;
close FILE;

# Copy other files
if (!-e "$deployPath/images") {
	print "Copying files...\n";

	`mkdir $deployPath/images`;
	`cp $htdocsPath/images/*.* $deployPath/images`;

	`mkdir $deployPath/images/help`;
	`cp $htdocsPath/images/help/*.* $deployPath/images/help`;

	`cp $htdocsPath/help.html $deployPath/help.html`;
	`mkdir $deployPath/style`;
	`cp $htdocsPath/style/help.css $deployPath/style/help.css`;
}

print "Deployment complete.\n";
