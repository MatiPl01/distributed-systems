module Controllers
module Home

  class Index
    def call(env)
      [200, { 'content-type' => 'text/html' }, [File.read('./views/form.html.erb')]]
    end
  end

end
end
