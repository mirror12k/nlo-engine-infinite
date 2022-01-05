#!/usr/bin/env perl
use strict;
use warnings;

use feature 'say';

use Sugar::IO::File;

use MIME::Base64;


my $html = Sugar::IO::File->new(shift // die "html file required")->read;

$html =~ s#(<script\b[^<>]+)src="([^"]+)"([^<>]*>)</script>#"$1$3" . Sugar::IO::File->new($2)->read . "</script>"#gse;



my $additions = '';
foreach my $arg ($html =~ m#assets/[^'"]+\.png#sg) {
	# say "img: $arg";
	my $data = Sugar::IO::File->new($arg)->read;
	$additions .= "<img style='display:none' data-url='$arg' src='data:image/png;base64," . encode_base64($data, '') . "' />\n";
}
die "failed to find <head> tag" unless $html =~ s/(<head>)/$1$additions/s;
# say $additions;

say $html;

