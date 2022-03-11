package cmd

import (
	"os"

	"github.com/spf13/cobra"
	"remoto.senwize.com/internal/application"
)

var rootCommand = &cobra.Command{
	Use:          "remoto",
	SilenceUsage: true,
}

func Execute() {
	rootCommand.Execute()
}

func init() {
	rootCommand.AddCommand(
		serveCommand(),
	)
}

func serveCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "serve",
		Short: "Start the server",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := loadConfig()
			app := application.New(application.Config{
				GuacdFQDN:    cfg.GuacdFQDN,
				SandboxFQDN:  cfg.SandboxFQDN,
				WorkshopCode: cfg.WorkshopCode,
			})

			app.Serve(cfg.HTTPAddr)

			return nil
		},
	}

	return cmd
}

// config ...
type config struct {
	GuacdFQDN    string
	SandboxFQDN  string
	HTTPAddr     string
	WorkshopCode string
}

func env(key, defaultValue string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return defaultValue
}

func loadConfig() *config {
	return &config{
		GuacdFQDN:    env("REMOTO_GUACD_FQDN", "guacd.remoto.local"),
		SandboxFQDN:  env("REMOTO_SANDBOX_FQDN", "sandbox.remoto.local"),
		HTTPAddr:     env("REMOTO_HTTP_ADDR", ":3000"),
		WorkshopCode: env("REMOTO_WORKSHOP_CODE", "demo"),
	}
}
