package config

import (
	"path"
	"path/filepath"
	"runtime"

	"github.com/joho/godotenv"
)

func packageDir() string {
	_, b, _, _ := runtime.Caller(0)
	d := path.Join(path.Dir(b))
	return d
}

func LoadConfig() {
	absPath, _ := filepath.Abs(packageDir() + "/.env")

	// Load config from env
	err := godotenv.Load(absPath)

	if err != nil {
		panic(err)
	}
}
