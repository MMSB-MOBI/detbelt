#!/usr/bin/perl

# GL, MG 12/05/2017
# Ask perl to perform a counter-clock wise rotation of  PI/2 around the x axis
# Who needs linear algebra :D

use strict;
use warnings;

while(<>) {
    if ($_ !~ /^(ATOM|HETATM)/) {
    #if($_ !~ /^(ATOM|HETATM)/) { 
        print $_;
        next;
    }

    my @tmp = split(//, $_);

    my @newZ = @tmp[38, 39, 40, 41, 42, 43, 44, 45];
    my @newY = @tmp[46, 47, 48, 49, 50, 51, 52, 53];


    #print "-->@newZ\n";
    #print "-->@newY\n";
    my $c = join("", @newZ);
    if ($c !~ /-/) {
        $c =~ s/[\s]([0-9])/-$1/;
    } else {
        $c =~ s/-([0-9])/ $1/;
    }
    @newZ = split(//, $c);

    for (my $i = 0; $i < 8 ; $i++) {
        $tmp[38 + $i] = $newY[$i];
        $tmp[46 + $i] = $newZ[$i];
    }
    print @tmp;
}
