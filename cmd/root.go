package main

import "github.com/spf13/cobra"

var rootCommand = &cobra.Command{}

func Execute() {
	rootCommand.Execute()
}
